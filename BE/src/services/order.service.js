import Product from "../models/product.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../error/error.js";

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
            throw new NotFoundError("Order not found");
        }
        return order;
    }

    async cancelOrder(id, userId, cancelReason) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundError("Order not found");
        }
        // Handle both populated (object with _id) and non-populated (ObjectId string) user
        const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
        if (orderUserId !== userId.toString()) {
            throw new ForbiddenError("Not authorized to cancel this order");
        }
        if (order.orderStatus !== "PENDING") {
            throw new BadRequestError("Only pending orders can be cancelled");
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
            throw new NotFoundError("Order not found");
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
                throw new NotFoundError(`Product ${item.productId} not found`);
            }
            if (!product.isActive) {
                throw new BadRequestError(`Product "${product.name}" is no longer available`);
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
                        throw new BadRequestError(`Insufficient stock for "${product.name}" - ${matchedVariant.color}`);
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