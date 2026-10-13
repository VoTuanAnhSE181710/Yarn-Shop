import { generateVNPayUrl } from "../../utils/vnpayHelper.js";
import { generateMomoUrl } from "../../utils/momoHelper.js";
import { generateSePayUrl } from "../../utils/sepayHelper.js";
import Address from "../../models/address.js";
import User from "../../models/user.js";
import mongoose from "mongoose";

export default class OrderController {
    constructor({ orderService, ghnService, membershipService }) {
        this.orderService = orderService;
        this.ghnService = ghnService;
        this.membershipService = membershipService;
    }

    /**
     * Địa chỉ giao hàng của đơn: dữ liệu FE gửi lên được ưu tiên, phần còn thiếu lấy từ hồ sơ người dùng.
     * - Không gửi shippingAddress -> dùng toàn bộ địa chỉ trong hồ sơ (họ tên, SĐT, địa chỉ chi tiết, tỉnh/huyện/xã, toạ độ).
     * - Có gửi vị trí (tên tỉnh/huyện/xã hoặc lat/lng) -> giữ đúng vị trí đó, chỉ bổ sung họ tên, SĐT,
     *   địa chỉ chi tiết còn trống (không trộn vị trí của hồ sơ với vị trí khác).
     */
    resolveShippingAddress = async (userId, input) => {
        const CONTACT_KEYS = ["fullName", "phone", "address"];
        const LOCATION_KEYS = ["provinceName", "districtName", "wardName", "provinceId", "districtId", "wardCode", "lat", "lng"];
        const given = (v) => v !== undefined && v !== null && v !== "";
        const pick = (obj, keys) =>
            Object.fromEntries(keys.filter((k) => given(obj?.[k])).map((k) => [k, obj[k]]));

        const profile = await User.findById(userId)
            .select("fullName phone address addressLocation")
            .lean();
        const hasInputLocation = LOCATION_KEYS.some((k) => given(input?.[k]));

        return {
            ...pick(profile, CONTACT_KEYS),
            ...(hasInputLocation ? {} : pick(profile?.addressLocation, LOCATION_KEYS)),
            ...pick(input, [...CONTACT_KEYS, ...LOCATION_KEYS]),
        };
    };

    /**
     * Create order and optionally generate VNPay payment URL
     */
    create = async (req, res, next) => {
        try {
            const { items, kits, paymentMethod } = req.body;

            if ((!items || items.length === 0) && (!kits || kits.length === 0)) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            // Địa chỉ: lấy từ FE gửi lên, phần thiếu (hoặc toàn bộ nếu không gửi) lấy từ hồ sơ người dùng
            const shippingAddress = await this.resolveShippingAddress(
                req.user.userId || req.user._id,
                req.body.shippingAddress,
            );
            if (!shippingAddress.fullName || !shippingAddress.phone) {
                return res.status(400).json({
                    message: "Thiếu họ tên hoặc số điện thoại người nhận. Vui lòng cập nhật hồ sơ hoặc nhập thông tin giao hàng.",
                });
            }
            const hasLocation =
                (shippingAddress.provinceName && shippingAddress.districtName && shippingAddress.wardName) ||
                (shippingAddress.lat !== undefined && shippingAddress.lng !== undefined);
            if (!req.body.shippingAddress && !hasLocation) {
                return res.status(400).json({
                    message: "Hồ sơ chưa có địa chỉ giao hàng. Vui lòng cập nhật địa chỉ trong hồ sơ hoặc nhập địa chỉ giao hàng.",
                });
            }

            // 1. Calculate total from DB (secure, prevents price manipulation)
            // Supports both product items and kit items
            let { validatedItems, itemsPrice, shippingFee, totalPrice } =
                await this.orderService.calculateOrderTotal(items || [], kits || []);

            // 2. Resolve GHN IDs from text address using mapAddressToGHN, then calculate shipping fee
            let resolvedAddress = { ...shippingAddress };
            let { provinceName: pName, districtName: dName, wardName: wName, lat, lng } = shippingAddress;

            if (lat !== undefined && lng !== undefined && (!pName || !dName || !wName)) {
                try {
                    const shippingService = req.container.resolve("shippingService");
                    const geocoded = await shippingService.reverseGeocode({ lat, lng });
                    pName = pName || geocoded.province;
                    dName = dName || geocoded.district;
                    wName = wName || geocoded.commune;
                    resolvedAddress.provinceName = pName;
                    resolvedAddress.districtName = dName;
                    resolvedAddress.wardName = wName;
                } catch (geoError) {
                    // Không để lỗi tra địa chỉ (vd Nominatim 429) làm hỏng việc đặt hàng
                    console.warn("[Order] Reverse geocode failed, continuing without GHN mapping:", geoError.message);
                }
            }

            if (!pName || !dName || !wName) {
                console.warn(`[Order] Missing address names, skip GHN mapping (province="${pName}" district="${dName}" ward="${wName}")`);
            }

            if (pName && dName && wName) {
                try {
                    const mapResult = await this.ghnService.mapAddressToGHN({ provinceName: pName, districtName: dName, wardName: wName });
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
                        totalPrice = itemsPrice + shippingFee;
                    } else {
                        console.warn("mapAddressToGHN fallback:", mapResult.message);
                    }
                } catch (error) {
                    console.error("Failed to resolve GHN address or shipping fee:", error.message);
                }
            }

            // 2b. Membership coin (FE CoinUsage): 1 coin = 1₫, checked against COIN_RULES + balance
            const userId = req.user.userId || req.user._id;
            const coinUsed = Number(req.body.coinUsed) || 0;
            if (coinUsed > 0) {
                const coinDiscount = await this.membershipService.validateCoinUsage(userId, coinUsed, itemsPrice);
                totalPrice = Math.max(0, totalPrice - coinDiscount);
            }

            // 3. Create order in DB (id generated up front so the coin transaction can reference it)
            const orderId = new mongoose.Types.ObjectId();
            if (coinUsed > 0) {
                await this.membershipService.redeemCoinsForOrder(userId, orderId, coinUsed);
            }
            let order;
            try {
                order = await this.orderService.createOrder({
                    _id: orderId,
                    user: userId,
                    items: validatedItems,
                    kitsRequest: kits, // pass requested kits to deduct stock
                    shippingAddress: resolvedAddress,
                    itemsPrice,
                    shippingFee,
                    totalPrice,
                    coinUsed,
                    payment: {
                        method: paymentMethod || "VNPAY",
                        status: "PENDING",
                    },
                });
            } catch (error) {
                if (coinUsed > 0) {
                    await this.membershipService
                        .addCoins(userId, coinUsed, "Hoàn coin do tạo đơn hàng thất bại")
                        .catch(console.error);
                }
                throw error;
            }

            // 3. Generate payment URL
            let payUrl = null;
            if (paymentMethod === "VNPAY" || !paymentMethod) {
                payUrl = generateVNPayUrl(order._id.toString(), totalPrice, req);
            } else if (paymentMethod === "MOMO") {
                payUrl = await generateMomoUrl(order._id.toString(), totalPrice);
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
            let { items, provinceName, districtName, wardName, lat, lng } = req.body;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            // Không gửi địa chỉ -> tính phí theo địa chỉ trong hồ sơ người dùng
            if (!provinceName && !districtName && !wardName && lat === undefined && lng === undefined) {
                const profileAddress = await this.resolveShippingAddress(req.user.userId || req.user._id, {});
                ({ provinceName, districtName, wardName, lat, lng } = profileAddress);
            }

            let pName = provinceName;
            let dName = districtName;
            let wName = wardName;

            if (lat !== undefined && lng !== undefined && (!pName || !dName || !wName)) {
                const shippingService = req.container.resolve("shippingService");
                const geocoded = await shippingService.reverseGeocode({ lat, lng });
                pName = pName || geocoded.province;
                dName = dName || geocoded.district;
                wName = wName || geocoded.commune;
            }

            if (!pName || !dName || !wName) {
                return res.status(400).json({ message: 'Vui lòng cung cấp provinceName, districtName, wardName hoặc lat, lng.' });
            }

            // 1. Calculate items total value from DB
            const { validatedItems, itemsPrice } = await this.orderService.calculateOrderTotal(items);
            
            // 2. Map text names to GHN IDs
            console.log(`[ShippingFee] Mapping address → GHN: province="${pName}" district="${dName}" ward="${wName}"`);
            const mapResult = await this.ghnService.mapAddressToGHN({ provinceName: pName, districtName: dName, wardName: wName });
            console.log(`[ShippingFee] mapAddressToGHN result:`, JSON.stringify(mapResult));
            
            let shippingFee = 30000; // default fallback fee
            
            if (mapResult.success) {
                // Calculate total weight (default to 100g per item if no weight field)
                let cartWeight = 0;
                validatedItems.forEach(item => {
                    cartWeight += (item.weight || 100) * item.quantity;
                });
                console.log(`[ShippingFee] districtId=${mapResult.districtId} wardCode=${mapResult.wardCode} weight=${cartWeight}g insurance=${itemsPrice}`);

                try {
                    const fee = await this.ghnService.calculateShippingFee({
                        to_district_id: mapResult.districtId,
                        to_ward_code: mapResult.wardCode,
                        weight: cartWeight,
                        insurance_value: itemsPrice,
                    });
                    console.log(`[ShippingFee] GHN fee result:`, JSON.stringify(fee));
                    shippingFee = fee.total;
                } catch (ghnErr) {
                    console.warn(`[ShippingFee] GHN calculateShippingFee FAILED → falling back. Reason: ${ghnErr.message}`);
                    mapResult.success = false; // Trigger fallback
                }
            }
            
            if (!mapResult.success) {
                console.warn(`[ShippingFee] mapAddressToGHN FAILED or GHN API failed → using fallback. Reason: ${mapResult.message}`);
                
                // Fallback to distance-based calculation if lat/lng is available
                if (lat !== undefined && lng !== undefined) {
                    const shippingService = req.container.resolve("shippingService");
                    const quote = await shippingService.calculateQuote({ lat, lng, orderValue: itemsPrice });
                    
                    if (quote.shippingFee !== null) {
                        console.log(`[ShippingFee] Fallback to distance-based fee: ${quote.shippingFee} (distance: ${quote.distanceKm}km)`);
                        shippingFee = quote.shippingFee;
                    } else {
                        console.warn(`[ShippingFee] Distance-based fallback returned null (out of bounds: ${quote.distanceKm}km). Using default 30k.`);
                    }
                }
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
            
            // Ownership check: customer can only see their own orders
            // Admin/Staff (who have Order/read permission via roleName check) can see any order
            const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
            const requestUserId = (req.user.userId || req.user._id).toString();
            const isAdminOrStaff = req.user.roleName === "Admin" || req.user.roleName === "Staff";
            
            if (!isAdminOrStaff && orderUserId !== requestUserId) {
                return res.status(403).json({ message: "Not authorized to view this order" });
            }
            
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
            // Generate new URL depending on payment method
            if (!order.payment.method || order.payment.method === "VNPAY") {
                payUrl = generateVNPayUrl(order._id.toString(), order.totalPrice, req);
            } else if (order.payment.method === "MOMO") {
                payUrl = await generateMomoUrl(order._id.toString(), order.totalPrice);
            } else if (order.payment.method === "SEPAY") {
                payUrl = generateSePayUrl(order._id.toString(), order.totalPrice);
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