import Order from '../models/order.js';

export default class OrderRepository {
    _filterVariants(order) {
        if (!order || !order.items) return order;
        order.items.forEach(item => {
            if (item.variantId && item.product && Array.isArray(item.product.variants)) {
                item.product.variants = item.product.variants.filter(
                    v => v._id && v._id.toString() === item.variantId.toString()
                );
            }
        });
        return order;
    }

    async findById(orderId) {
        const order = await Order.findById(orderId)
            .populate('user', 'username email fullName')
            .populate('items.product')
            .lean();
        return this._filterVariants(order);
    }

    async create(data) {
        const order = await Order.create(data);
        return order; // creation doesn't heavily populate usually, but if needed, we return as is
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

        orders.forEach(o => this._filterVariants(o));

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
        const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true, runValidators: true })
            .populate('user', 'username email fullName')
            .populate('items.product')
            .lean();
        return this._filterVariants(order);
    }

    async delete(orderId) {
        return Order.findByIdAndDelete(orderId);
    }
}