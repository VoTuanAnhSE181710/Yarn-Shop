import Order from "../models/order.js";

export default class OrderReportService {
    constructor({ orderReportRepository }) {
        this.orderReportRepository = orderReportRepository;
    }

    async createReport(data, userId) {
        const { orderId, title, description, images } = data;

        // Validate order exists
        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }

        // Validate user owns the order
        const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
        if (orderUserId !== userId.toString()) {
            const error = new Error("You can only report issues on your own orders");
            error.statusCode = 403;
            throw error;
        }

        return this.orderReportRepository.create({
            orderId,
            reporterId: userId,
            title,
            description,
            images: images || [],
            status: "PENDING",
        });
    }

    async getMyReports(userId, query = {}) {
        const { page = 1, limit = 10 } = query;
        return this.orderReportRepository.findByReporterId(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }

    async getReportById(reportId, userId, isAdmin) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }

        // Non-admin users can only view their own reports
        if (!isAdmin && report.reporterId?.toString() !== userId?.toString()) {
            const error = new Error("Not authorized to view this report");
            error.statusCode = 403;
            throw error;
        }

        return report;
    }

    async updateReport(reportId, data, userId) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }

        // Only reporter can update, and only when PENDING
        if (report.reporterId?.toString() !== userId?.toString()) {
            const error = new Error("Not authorized to update this report");
            error.statusCode = 403;
            throw error;
        }

        if (report.status !== "PENDING") {
            const error = new Error("Cannot update report when status is not PENDING");
            error.statusCode = 400;
            throw error;
        }

        return this.orderReportRepository.update(reportId, data);
    }

    async deleteReport(reportId, userId) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }

        // Only reporter can delete, and only when PENDING
        if (report.reporterId?.toString() !== userId?.toString()) {
            const error = new Error("Not authorized to delete this report");
            error.statusCode = 403;
            throw error;
        }

        if (report.status !== "PENDING") {
            const error = new Error("Cannot delete report when status is not PENDING");
            error.statusCode = 400;
            throw error;
        }

        return this.orderReportRepository.delete(reportId);
    }

    async getAllReports(query = {}) {
        const { page = 1, limit = 10, search, status, sort } = query;
        let filter = {};

        if (status) filter.status = status;

        if (search) {
            const searchRegex = new RegExp(search.trim(), "i");
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(search.trim());
            if (isObjectId) {
                filter.$or = [
                    { _id: search.trim() },
                    { orderId: search.trim() },
                ];
            } else {
                filter.title = searchRegex;
            }
        }

        let sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };
        if (sort === "status") sortOption = { status: 1 };

        return this.orderReportRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sortOption,
        });
    }

    async updateStatus(reportId, status, adminNote) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }

        const updateData = { status };
        if (adminNote !== undefined) updateData.adminNote = adminNote;

        return this.orderReportRepository.update(reportId, updateData);
    }

    async assignStaff(reportId, staffId) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }

        return this.orderReportRepository.update(reportId, { assignedStaff: staffId });
    }

    async updateAdminNote(reportId, adminNote) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }

        return this.orderReportRepository.update(reportId, { adminNote });
    }

    // Admin delete any report
    async adminDeleteReport(reportId) {
        const report = await this.orderReportRepository.delete(reportId);
        if (!report) {
            const error = new Error("Report not found");
            error.statusCode = 404;
            throw error;
        }
        return report;
    }
}