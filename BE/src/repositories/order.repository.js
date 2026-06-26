import Order from '../models/order.js';

export default class OrderRepository {
    async findById(orderId) {
        return Order.findById(orderId).populate('user', 'username email fullName').populate('items.product');
    }

    async create(data) {
        return Order.create(data);
    }

    async findAll({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } }) {
        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('user', 'username email fullName')
            .populate('items.product')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Order.countDocuments(filter);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async update(orderId, updateData) {
        return Order.findByIdAndUpdate(orderId, updateData, { new: true, runValidators: true })
            .populate('user', 'username email fullName')
            .populate('items.product');
    }

    async delete(orderId) {
        return Order.findByIdAndDelete(orderId);
    }
}