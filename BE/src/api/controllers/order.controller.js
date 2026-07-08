import { generateVNPayUrl } from "../../utils/vnpayHelper.js";

export default class OrderController {
    constructor({ orderService }) {
        this.orderService = orderService;
    }

    /**
     * Create order and optionally generate VNPay payment URL
     */
    create = async (req, res, next) => {
        try {
            const { items, shippingAddress, paymentMethod } = req.body;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }
            if (!shippingAddress) {
                return res.status(400).json({ message: "Shipping address is required" });
            }

            // 1. Calculate total from DB (secure, prevents price manipulation)
            const { validatedItems, itemsPrice, shippingFee, totalPrice } =
                await this.orderService.calculateOrderTotal(items);

            // 2. Create order in DB
            const order = await this.orderService.createOrder({
                user: req.user.userId || req.user._id,
                items: validatedItems,
                shippingAddress,
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

            const validStatuses = ["CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED"];
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
            return res.status(200).json({ message: "Order cancelled successfully", order });
        } catch (error) {
            next(error);
        }
    };
}