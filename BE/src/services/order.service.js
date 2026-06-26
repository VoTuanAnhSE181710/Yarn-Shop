import Product from "../models/product.js";

export default class OrderService {
    constructor({ orderRepository }) {
        this.orderRepository = orderRepository;
    }

    async createOrder(data) {
        return this.orderRepository.create(data);
    }

    async getOrderById(id) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
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
        const { page = 1, limit = 20, status, paymentStatus } = query;
        let filter = {};
        if (status) filter.orderStatus = status;
        if (paymentStatus) filter["payment.status"] = paymentStatus;

        return this.orderRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
        });
    }

    async updateOrderStatus(id, orderStatus) {
        const order = await this.orderRepository.update(id, {
            orderStatus,
            ...(orderStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        });
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }
        return order;
    }

    async cancelOrder(id, userId, cancelReason) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }
        if (order.user.toString() !== userId.toString()) {
            const error = new Error("Not authorized to cancel this order");
            error.statusCode = 403;
            throw error;
        }
        if (order.orderStatus !== "PENDING") {
            const error = new Error("Only pending orders can be cancelled");
            error.statusCode = 400;
            throw error;
        }
        return this.orderRepository.update(id, {
            orderStatus: "CANCELLED",
            cancelReason,
        });
    }

    async updatePaymentStatus(id, paymentStatus, transactionNo) {
        const update = {
            "payment.status": paymentStatus,
            ...(paymentStatus === "PAID" ? { "payment.paidAt": new Date() } : {}),
            ...(transactionNo ? { "payment.transactionNo": transactionNo } : {}),
        };
        const order = await this.orderRepository.update(id, update);
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }
        return order;
    }

    /**
     * Calculate total from cart items by querying DB prices
     */
    async calculateOrderTotal(items) {
        let itemsPrice = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                const error = new Error(`Product ${item.productId} not found`);
                error.statusCode = 404;
                throw error;
            }
            if (!product.isActive) {
                const error = new Error(`Product "${product.name}" is no longer available`);
                error.statusCode = 400;
                throw error;
            }

            // Find matching variant by color/hexCode
            let price = product.variants[0]?.price || 0;
            let variantInfo = {};

            if (item.color || item.hexCode) {
                const matchedVariant = product.variants.find(
                    (v) => v.color === item.color || v.hexCode === item.hexCode
                );
                if (matchedVariant) {
                    price = matchedVariant.price;
                    if (matchedVariant.stock < item.quantity) {
                        const error = new Error(`Insufficient stock for "${product.name}" - ${matchedVariant.color}`);
                        error.statusCode = 400;
                        throw error;
                    }
                    variantInfo = { color: matchedVariant.color, hexCode: matchedVariant.hexCode };
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
                variant: variantInfo,
            });
        }

        const shippingFee = itemsPrice >= 300000 ? 0 : 30000;
        const totalPrice = itemsPrice + shippingFee;

        return { validatedItems, itemsPrice, shippingFee, totalPrice };
    }
}