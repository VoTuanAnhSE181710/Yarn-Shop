import OrderReport from '../models/orderReport.js';

export default class OrderReportRepository {
    async findById(reportId) {
        return OrderReport.findById(reportId).lean();
    }

    async findByOrderId(orderId) {
        return OrderReport.find({ orderId }).sort({ createdAt: -1 }).lean();
    }

    async findByReporterId(reporterId, { page = 1, limit = 10 } = {}) {
        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            OrderReport.find({ reporterId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            OrderReport.countDocuments({ reporterId }),
        ]);
        return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findAll({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            OrderReport.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            OrderReport.countDocuments(filter),
        ]);
        return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async create(data) {
        return OrderReport.create(data);
    }

    async update(reportId, updateData) {
        return OrderReport.findByIdAndUpdate(reportId, updateData, { new: true, runValidators: true }).lean();
    }

    async delete(reportId) {
        return OrderReport.findByIdAndDelete(reportId);
    }
}