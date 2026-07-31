import { generateVNPayUrl } from "../../utils/vnpayHelper.js";
import Address from "../../models/address.js";

export default class OrderController {
    constructor({ orderService, ghnService }) {
        this.orderService = orderService;
        this.ghnService = ghnService;
    }

    /**
     * Create order and optionally generate VNPay payment URL
     */
    create = async (req, res, next) => {
        try {
            const { items, kits, shippingAddress, paymentMethod } = req.body;

            if ((!items || items.length === 0) && (!kits || kits.length === 0)) {
                return res.status(400).json({ message: "Cart is empty" });
            }
            if (!shippingAddress) {
                return res.status(400).json({ message: "Shipping address is required" });
            }

            // 1. Calculate total from DB (secure, prevents price manipulation)
            // Supports both product items and kit items
            let { validatedItems, itemsPrice, shippingFee, totalPrice } =
                await this.orderService.calculateOrderTotal(items || [], kits || []);

            // 2. Resolve GHN IDs from text address using mapAddressToGHN, then calculate shipping fee
            let resolvedAddress = { ...shippingAddress };
            const { provinceName, districtName, wardName } = shippingAddress;

            if (provinceName && districtName && wardName) {
                try {
                    const mapResult = await this.ghnService.mapAddressToGHN({ provinceName, districtName, wardName });
                    if (mapResult.success) {
                        resolvedAddress.provinceId = mapResult.provinceId;
                        resolvedAddress.districtId = mapResult.districtId;
                        resolvedAddress.wardCode = mapResult.wardCode;

                        let cartWeight = 0;
                        validatedItems.forEach(item => {
                            cartWeight += (item.weight || 100) * item.quantity;
                        });

                        const fee = await this.ghnService.calculateShippingFee({
                            to_district_id: mapResult.districtId,
                            to_ward_code: mapResult.wardCode,
                            weight: cartWeight,
                            insurance_value: itemsPrice,
                        });
                        shippingFee = fee.total;
                        if (itemsPrice >= 300000) {
                            shippingFee = 0;
                        }
                        totalPrice = itemsPrice + shippingFee;
                    } else {
                        console.warn("mapAddressToGHN fallback:", mapResult.message);
                    }
                } catch (error) {
                    console.error("Failed to resolve GHN address or shipping fee:", error.message);
                }
            }

            // 3. Create order in DB
            const order = await this.orderService.createOrder({
                user: req.user.userId || req.user._id,
                items: validatedItems,
                kitsRequest: kits, // pass requested kits to deduct stock
                shippingAddress: resolvedAddress,
                itemsPrice,
                shippingFee,
                totalPrice,
                payment: {
                    method: paymentMethod || "VNPAY",
                    status: "PENDING",
                },
            });

            // 3. If VNPay, generate payment URL
            let payUrl = null;
            if (paymentMethod === "VNPAY" || !paymentMethod) {
                payUrl = generateVNPayUrl(order._id.toString(), totalPrice, req);
            }

            return res.status(201).json({
                message: "Order created successfully",
                order,
                payUrl,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Calculate shipping fee
     */
    calculateShippingFee = async (req, res, next) => {
        try {
            const { items, provinceName, districtName, wardName } = req.body;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            if (!provinceName || !districtName || !wardName) {
                return res.status(400).json({ message: 'Vui lòng cung cấp provinceName, districtName và wardName.' });
            }

            // 1. Calculate items total value from DB
            const { validatedItems, itemsPrice } = await this.orderService.calculateOrderTotal(items);
            
            // 2. Map text names to GHN IDs
            const mapResult = await this.ghnService.mapAddressToGHN({ provinceName, districtName, wardName });
            
            let shippingFee = 30000; // default fee
            
            if (mapResult.success) {
                // Calculate total weight (default to 100g per item if no weight field)
                let cartWeight = 0;
                validatedItems.forEach(item => {
                    cartWeight += (item.weight || 100) * item.quantity;
                });

                const fee = await this.ghnService.calculateShippingFee({
                    to_district_id: mapResult.districtId,
                    to_ward_code: mapResult.wardCode,
                    weight: cartWeight,
                    insurance_value: itemsPrice,
                });
                
                shippingFee = fee.total;
            } else {
                console.warn("mapAddressToGHN failed in preview:", mapResult.message);
                // We proceed with the default shippingFee if GHN fails or address can't be mapped
            }
            
            // Apply free shipping logic if itemsPrice >= 300000
            if (itemsPrice >= 300000) {
                shippingFee = 0;
            }

            return res.status(200).json({
                subtotal: itemsPrice,
                shippingFee: shippingFee,
                total: itemsPrice + shippingFee
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get order by ID (own order for customer, any for admin/staff)
     */
    getById = async (req, res, next) => {
        try {
            const order = await this.orderService.getOrderById(req.params.id);
            return res.status(200).json({ message: "Order retrieved successfully", order });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get current user's orders
     */
    getMyOrders = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const result = await this.orderService.getMyOrders(userId, req.query);
            return res.status(200).json({ message: "Orders retrieved successfully", ...result });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all orders (admin/staff only)
     */
    getAll = async (req, res, next) => {
        try {
            const result = await this.orderService.getAllOrders(req.query);
            return res.status(200).json({ message: "Orders retrieved successfully", ...result });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update order status (admin/staff only)
     */
    updateStatus = async (req, res, next) => {
        try {
            const { orderStatus } = req.body;
            if (!orderStatus) {
                return res.status(400).json({ message: "Order status is required" });
            }

            const validStatuses = ["CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED", "PROCESSED", "REJECTED"];
            if (!validStatuses.includes(orderStatus)) {
                return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
            }

            const order = await this.orderService.updateOrderStatus(req.params.id, orderStatus);
            return res.status(200).json({ message: "Order status updated successfully", order });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cancel own order (customer only)
     */
    cancel = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const { cancelReason } = req.body;
            const order = await this.orderService.cancelOrder(req.params.id, userId, cancelReason);
            return res.status(200).json({ message: "Cancel request submitted. Awaiting admin approval.", order });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Admin approves or rejects a customer's cancel request
     */
    handleCancelRequest = async (req, res, next) => {
        try {
            const { decision } = req.body; // "APPROVED" | "REJECTED"
            const adminId = req.user.userId || req.user._id;
            if (!decision) {
                return res.status(400).json({ message: "Decision is required (APPROVED or REJECTED)" });
            }
            const order = await this.orderService.handleCancelRequest(req.params.id, decision, adminId);
            return res.status(200).json({ message: `Cancel request ${decision.toLowerCase()}`, order });
        } catch (error) {
            next(error);
        }
    };
    /**
     * Retry payment for a cancelled or unpaid order
     */
    retryPayment = async (req, res, next) => {
        try {
            const userId = req.user.userId || req.user._id;
            const order = await this.orderService.retryPayment(req.params.id, userId);

            let payUrl = null;
            // Generate new VNPay URL if payment method is VNPAY (or default)
            if (!order.payment.method || order.payment.method === "VNPAY") {
                payUrl = generateVNPayUrl(order._id.toString(), order.totalPrice, req);
            }

            return res.status(200).json({
                message: "Retry payment initiated successfully",
                order,
                payUrl,
            });
        } catch (error) {
            next(error);
        }
    };
}