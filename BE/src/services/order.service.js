import Product from "../models/product.js";
import Kit from "../models/kit.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../error/error.js";

export default class OrderService {
    constructor({ orderRepository, notificationService, logRepository }) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.logRepository = logRepository;
    }

    async createOrder(data) {
        const order = await this.orderRepository.create(data);

        // Deduct stock from product variants for each item
        for (const item of data.items || []) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            if (item.variantId) {
                // Deduct from the specific variant
                const variantIndex = product.variants.findIndex(
                    v => v._id.toString() === item.variantId.toString()
                );
                if (variantIndex !== -1) {
                    product.variants[variantIndex].stock = Math.max(
                        0,
                        product.variants[variantIndex].stock - item.quantity
                    );
                }
            } else {
                // Deduct from first variant if no variantId
                if (product.variants.length > 0) {
                    product.variants[0].stock = Math.max(
                        0,
                        product.variants[0].stock - item.quantity
                    );
                }
            }
            await product.save();
        }

        // Deduct stock from kits if they are provided
        if (data.kitsRequest && data.kitsRequest.length > 0) {
            for (const kitEntry of data.kitsRequest) {
                const kit = await Kit.findById(kitEntry.kitId);
                if (kit) {
                    kit.stock = Math.max(0, kit.stock - (kitEntry.quantity || 1));
                    await kit.save();
                }
            }
        }

        if (this.notificationService) {
            await this.notificationService.createAndEmitNotification({
                type: "ORDER",
                priority: "NORMAL",
                title: "Đơn hàng mới",
                message: `Khách hàng vừa đặt đơn hàng mới: ${order._id}`,
                targetRole: "Admin"
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
        const order = await this.orderRepository.update(id, {
            orderStatus,
            ...(orderStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        });
        if (!order) {
            throw new NotFoundError("Order not found");
        }
        if (this.notificationService) {
            const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
            await this.notificationService.createAndEmitNotification({
                type: "ORDER",
                priority: "NORMAL",
                title: "Cập nhật trạng thái đơn hàng",
                message: `Đơn hàng ${order._id} của bạn đã chuyển sang trạng thái ${orderStatus}`,
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