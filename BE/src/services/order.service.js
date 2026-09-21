import Product from "../models/product.js";
import Kit from "../models/kit.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../error/error.js";

export default class OrderService {
    constructor({ orderRepository, notificationService, logRepository, ghnService }) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.logRepository = logRepository;
        this.ghnService = ghnService;
    }

    async createOrder(data) {
        const order = await this.orderRepository.create(data);

        if (data.payment && data.payment.method === "COD") {
            // Deduct immediately for COD
            await this.deductStock(order._id);
        }

        if (this.notificationService) {
            await this.notificationService.createNotification({
                type: "ORDER",
                priority: "NORMAL",
                title: "Đơn hàng mới",
                message: `Khách hàng vừa đặt đơn hàng mới: ${order._id}`,
                targetRole: "Admin"
            }).catch(console.error);

            if (data.payment && data.payment.method === "COD") {
                await this.notificationService.createNotification({
                    type: "ORDER",
                    priority: "NORMAL",
                    title: "Đơn hàng COD mới cần duyệt",
                    message: `Có đơn COD mới #${order._id} đang chờ xác nhận.`,
                    targetRole: "Staff"
                }).catch(console.error);
            }

            await this.notificationService.createNotification({
                type: "ORDER",
                priority: "NORMAL",
                title: "Đặt hàng thành công",
                message: `Đơn hàng #${order._id} của bạn đã được tiếp nhận và đang chờ xử lý.`,
                userId: data.user
            }).catch(console.error);
        }
        if (this.logRepository) {
            await this.logRepository.saveLog({
                action: "CREATE",
                targetType: "ORDER",
                outcome: "SUCCESS",
                actorId: data.user,
                details: { orderId: order._id, itemsPrice: data.itemsPrice }
            });
        }
        return order;
    }

    async deductStock(orderId) {
        const order = await this.orderRepository.findById(orderId);
        if (!order || order.stockDeducted) return;

        // Verify stock first
        let hasEnoughStock = true;
        for (const item of order.items || []) {
            if (item.itemType === 'Course') continue;
            const product = await Product.findById(item.product);
            if (!product) continue;
            let variant = item.variantId 
                ? product.variants.find(v => v._id.toString() === item.variantId.toString())
                : product.variants[0];
            if (variant && variant.stock < item.quantity) {
                hasEnoughStock = false;
                break;
            }
        }
        for (const kitEntry of order.kitsRequest || []) {
            const kit = await Kit.findById(kitEntry.kitId);
            if (kit && kit.stock < (kitEntry.quantity || 1)) {
                hasEnoughStock = false;
                break;
            }
        }

        if (!hasEnoughStock) {
            // Flag order as out of stock, do not deduct.
            await this.orderRepository.update(orderId, { orderStatus: "OUT_OF_STOCK" });
            if (this.notificationService) {
                await this.notificationService.createAndEmitNotification({
                    type: "ORDER",
                    priority: "HIGH",
                    title: "Đơn hàng bị thiếu tồn kho",
                    message: `Đơn hàng ${orderId} đã thanh toán/xác nhận nhưng kho không đủ hàng! Vui lòng hoàn tiền hoặc liên hệ khách.`,
                    targetRole: "Admin"
                }).catch(console.error);
            }
            return;
        }

        // Proceed to deduct
        for (const item of order.items || []) {
            if (item.itemType === 'Course') continue;
            const product = await Product.findById(item.product);
            if (!product) continue;
            let variant = item.variantId 
                ? product.variants.find(v => v._id.toString() === item.variantId.toString())
                : product.variants[0];
            if (variant) {
                variant.stock -= item.quantity;
                await product.save();
            }
        }
        for (const kitEntry of order.kitsRequest || []) {
            const kit = await Kit.findById(kitEntry.kitId);
            if (kit) {
                kit.stock -= (kitEntry.quantity || 1);
                await kit.save();
            }
        }

        await this.orderRepository.update(orderId, { stockDeducted: true });
    }

    async grantPurchasedCourses(orderId) {
        const order = await this.orderRepository.findById(orderId);
        if (!order || !order.user) return;
        
        const courseIds = [];
        for (const item of order.items || []) {
            if (item.itemType === 'Course' && item.course) {
                courseIds.push(item.course);
            }
        }
        
        if (courseIds.length > 0) {
            const User = (await import("../models/user.js")).default;
            await User.findByIdAndUpdate(order.user, {
                $addToSet: { purchasedCourses: { $each: courseIds } }
            });
        }
    }

    async getOrderById(id) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundError("Order not found");
        }
        return order;
    }

    async getMyOrders(userId, query = {}) {
        const { page = 1, limit = 10 } = query;
        return this.orderRepository.findAll({
            filter: { user: userId },
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
        });
    }

    async getAllOrders(query = {}) {
        const { page = 1, limit = 20, status, paymentStatus, isCancelRequested } = query;
        let filter = {};
        if (status) filter.orderStatus = status;
        if (paymentStatus) filter["payment.status"] = paymentStatus;
        // Allow Admin to filter pending cancel requests
        if (isCancelRequested !== undefined) filter.isCancelRequested = isCancelRequested === "true";

        return this.orderRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
        });
    }

    async updateOrderStatus(id, orderStatus, actorId = null) {
        // If transitioning to SHIPPING, create order on GHN
        if (orderStatus === "SHIPPING" && this.ghnService) {
            const currentOrder = await this.orderRepository.findById(id);
            if (!currentOrder) throw new NotFoundError("Order not found");
            
            // Push to GHN if not already pushed
            if (!currentOrder.trackingCode) {
                try {
                    const ghnRes = await this.ghnService.createShippingOrder(currentOrder);
                    await this.orderRepository.update(id, {
                        trackingCode: ghnRes.trackingCode,
                        expectedDeliveryTime: ghnRes.expectedDeliveryTime
                    });
                } catch (error) {
                    console.error("Lỗi tự động đẩy đơn GHN:", error.message);
                    // Có thể throw luôn hoặc chỉ log tùy yêu cầu. FE có thể bắt lỗi.
                    throw new BadRequestError(`Không thể tạo đơn GHN: ${error.message}`);
                }
            }
        }

        const order = await this.orderRepository.update(id, {
            orderStatus,
            ...(orderStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        });
        if (!order) {
            throw new NotFoundError("Order not found");
        }
        if (this.notificationService) {
            const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
            
            let statusText = orderStatus;
            let titleText = "Cập nhật trạng thái đơn hàng";
            let msgText = `Đơn hàng #${order._id} của bạn đã chuyển sang trạng thái ${orderStatus}`;

            if (orderStatus === "SHIPPING") {
                titleText = "Đơn hàng đang được giao";
                const deliveryStr = order.expectedDeliveryTime ? ` Dự kiến giao vào: ${new Date(order.expectedDeliveryTime).toLocaleDateString("vi-VN")}.` : "";
                msgText = `Đơn hàng #${order._id} của bạn đã được bàn giao cho đơn vị vận chuyển.${deliveryStr}`;
            } else if (orderStatus === "DELIVERED") {
                titleText = "Giao hàng thành công";
                msgText = `Đơn hàng #${order._id} đã được giao thành công. Vui lòng xác nhận đã nhận được hàng.`;
            } else if (orderStatus === "CANCELLED") {
                titleText = "Đơn hàng đã huỷ";
                msgText = `Đơn hàng #${order._id} đã bị huỷ.`;
            } else if (orderStatus === "CONFIRMED") {
                titleText = "Đơn hàng đã được xác nhận";
                msgText = `Đơn hàng #${order._id} của bạn đã được xác nhận.`;
            }

            await this.notificationService.createNotification({
                type: "ORDER",
                priority: "NORMAL",
                title: titleText,
                message: msgText,
                userId: orderUserId
            }).catch(console.error);
        }
        if (this.logRepository) {
            await this.logRepository.saveLog({
                action: "UPDATE",
                targetType: "ORDER",
                outcome: "SUCCESS",
                actorId,
                details: { orderId: id, status: orderStatus }
            });
        }
        return order;
    }

    /**
     * Customer requests to cancel an order.
     * Does NOT cancel immediately — sets isCancelRequested = true and notifies Admin.
     */
    async cancelOrder(id, userId, cancelReason) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundError("Order not found");
        }

        const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
        if (orderUserId !== userId.toString()) {
            throw new ForbiddenError("Not authorized to cancel this order");
        }
        if (order.orderStatus !== "PENDING") {
            throw new BadRequestError("Only pending orders can be cancelled");
        }
        if (order.isCancelRequested) {
            throw new BadRequestError("A cancel request is already pending for this order");
        }

        const updatedOrder = await this.orderRepository.update(id, {
            isCancelRequested: true,
            cancelReason,
            cancelRequestedAt: new Date(),
        });

        // Immediately create a RefundInvoice (as PENDING) so it shows up in the admin's refund invoices list.
        // Even if the order is not paid, we create it so the Admin can process the cancellation request from that screen.
        const RefundInvoice = (await import("../models/RefundInvoice.js")).default;
        let refundAmount = 0;
        if (order.payment && order.payment.status === "PAID") {
            refundAmount = order.totalPrice * 0.9;
        }
        await RefundInvoice.create({
            orderId: order._id,
            userId: orderUserId,
            amount: refundAmount,
            reason: cancelReason || "Order cancelled by user",
            status: "PENDING"
        });

        if (this.notificationService) {
            await this.notificationService.createAndEmitNotification({
                type: "ORDER",
                priority: "HIGH",
                title: "Yêu cầu hủy đơn hàng",
                message: `Khách hàng yêu cầu hủy đơn hàng ${order._id}. Lý do: ${cancelReason || "Không có lý do"}`,
                targetRole: "Admin"
            }).catch(console.error);
        }

        if (this.logRepository) {
            await this.logRepository.saveLog({
                action: "UPDATE",
                targetType: "ORDER",
                outcome: "SUCCESS",
                actorId: userId,
                details: { orderId: id, action: "CANCEL_REQUESTED", reason: cancelReason }
            });
        }

        return updatedOrder;
    }

    /**
     * Admin approves or rejects a customer's cancel request.
     * decision: "APPROVED" | "REJECTED"
     */
    async handleCancelRequest(id, decision, adminId) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundError("Order not found");
        }
        if (!order.isCancelRequested) {
            throw new BadRequestError("This order has no pending cancel request");
        }

        const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();

        if (decision === "APPROVED") {
            // Cancel the order
            await this.orderRepository.update(id, {
                orderStatus: "CANCELLED",
                isCancelRequested: false,
            });

            if (this.notificationService) {
                await this.notificationService.createAndEmitNotification({
                    type: "ORDER",
                    priority: "NORMAL",
                    title: "Yêu cầu hủy đơn được chấp thuận",
                    message: `Đơn hàng ${order._id} của bạn đã được hủy thành công.`,
                    userId: orderUserId
                }).catch(console.error);
            }

            if (this.logRepository) {
                await this.logRepository.saveLog({
                    action: "DELETE",
                    targetType: "ORDER",
                    outcome: "SUCCESS",
                    actorId: adminId,
                    details: { orderId: id, decision: "APPROVED" }
                });
            }
        } else if (decision === "REJECTED") {
            // Keep PENDING, just clear the cancel request flag
            await this.orderRepository.update(id, {
                isCancelRequested: false,
                cancelReason: null,
                cancelRequestedAt: null,
            });

            if (this.notificationService) {
                await this.notificationService.createAndEmitNotification({
                    type: "ORDER",
                    priority: "NORMAL",
                    title: "Yêu cầu hủy đơn bị từ chối",
                    message: `Yêu cầu hủy đơn hàng ${order._id} của bạn đã bị từ chối. Đơn hàng vẫn đang được xử lý.`,
                    userId: orderUserId
                }).catch(console.error);
            }

            if (this.logRepository) {
                await this.logRepository.saveLog({
                    action: "UPDATE",
                    targetType: "ORDER",
                    outcome: "SUCCESS",
                    actorId: adminId,
                    details: { orderId: id, decision: "REJECTED" }
                });
            }
        } else {
            throw new BadRequestError("Decision must be APPROVED or REJECTED");
        }

        return this.orderRepository.findById(id);
    }

    async updatePaymentStatus(id, paymentStatus, transactionNo) {
        const update = {
            "payment.status": paymentStatus,
            ...(paymentStatus === "PAID" ? { "payment.paidAt": new Date() } : {}),
            ...(transactionNo ? { "payment.transactionNo": transactionNo } : {}),
        };
        const order = await this.orderRepository.update(id, update);
        if (!order) {
            throw new NotFoundError("Order not found");
        }
        if (paymentStatus === "PAID") {
            await this.grantPurchasedCourses(id);
        }
        return order;
    }

    /**
     * Retry payment for a cancelled or unpaid order
     */
    async retryPayment(id, userId) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundError("Order not found");
        }

        const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
        if (orderUserId !== userId.toString()) {
            throw new ForbiddenError("Not authorized to access this order");
        }

        if (order.orderStatus !== "CANCELLED" && order.orderStatus !== "PENDING") {
            throw new BadRequestError("Only cancelled or pending orders can be retried for payment");
        }
        
        if (order.payment && order.payment.status === "PAID") {
            throw new BadRequestError("Order is already paid");
        }

        const updatedOrder = await this.orderRepository.update(id, {
            orderStatus: "PENDING",
            "payment.status": "PENDING",
            isCancelRequested: false,
            cancelReason: null,
            cancelRequestedAt: null,
        });

        if (this.logRepository) {
            await this.logRepository.saveLog({
                action: "UPDATE",
                targetType: "ORDER",
                outcome: "SUCCESS",
                actorId: userId,
                details: { orderId: id, action: "RETRY_PAYMENT" }
            });
        }

        return updatedOrder;
    }

    /**
     * Calculate total from cart items (products) by querying DB prices.
     * Optionally accepts kits: [{kitId, quantity}] to expand kit products into items.
     */
    async calculateOrderTotal(items, kits = []) {
        let allItems = [...(items || [])];

        // Expand kit items into product items
        if (kits && kits.length > 0) {
            for (const kitEntry of kits) {
                const kit = await Kit.findById(kitEntry.kitId).populate("products.productId");
                if (!kit) throw new NotFoundError(`Kit ${kitEntry.kitId} not found`);
                if (!kit.isActive) throw new BadRequestError(`Kit "${kit.name}" is no longer available`);
                
                const kitQty = kitEntry.quantity || 1;
                if (kit.stock < kitQty) {
                    throw new BadRequestError(`Insufficient stock for Kit "${kit.name}"`);
                }

                for (const kitProduct of kit.products) {
                    allItems.push({
                        productId: kitProduct.productId._id,
                        quantity: kitProduct.quantity * kitQty,
                        kitId: kit._id, // track which kit this came from
                    });
                }
            }
        }

        let itemsPrice = 0;
        const validatedItems = [];

        for (const item of allItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new NotFoundError(`Product ${item.productId} not found`);
            }
            if (!product.isActive) {
                throw new BadRequestError(`Product "${product.name}" is no longer available`);
            }

            let price = product.variants[0]?.price || 0;
            if (item.variantId) {
                const matchedVariant = product.variants.find(
                    (v) => v._id && v._id.toString() === item.variantId.toString()
                );
                if (matchedVariant) {
                    price = matchedVariant.price;
                    if (matchedVariant.stock < item.quantity) {
                        throw new BadRequestError(`Insufficient stock for "${product.name}" variant`);
                    }
                }
            }

            const lineTotal = price * item.quantity;
            itemsPrice += lineTotal;

            validatedItems.push({
                product: product._id,
                name: product.name,
                image: product.image || product.images?.[0] || "",
                price,
                quantity: item.quantity,
                variantId: item.variantId || null,
                kitId: item.kitId || null,
            });
        }

        const shippingFee = 30000;
        const totalPrice = itemsPrice + shippingFee;

        return { validatedItems, itemsPrice, shippingFee, totalPrice };
    }
}