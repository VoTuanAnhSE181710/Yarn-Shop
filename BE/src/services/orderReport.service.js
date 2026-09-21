import Order from "../models/order.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../error/error.js";

export default class OrderReportService {
    constructor({ orderReportRepository, notificationService }) {
        this.orderReportRepository = orderReportRepository;
        this.notificationService = notificationService;
    }

    async createReport(data, userId) {
        const { orderId, title, description, images } = data;

        // Validate order exists
        const order = await Order.findById(orderId);
        if (!order) {
            throw new NotFoundError("Order not found");
        }

        // Validate user owns the order
        const orderUserId = order.user?._id ? order.user._id.toString() : order.user.toString();
        if (orderUserId !== userId.toString()) {
            throw new ForbiddenError("You can only report issues on your own orders");
        }

        const report = await this.orderReportRepository.create({
            orderId,
            reporterId: userId,
            title,
            description,
            images: images || [],
            status: "PENDING",
        });

        if (this.notificationService) {
            await this.notificationService.createNotification({
                type: "REPORT", priority: "NORMAL", title: "Đã gửi khiếu nại đơn hàng",
                message: `Khiếu nại cho đơn hàng #${orderId} của bạn đã được ghi nhận.`,
                userId: userId
            }).catch(console.error);
            await this.notificationService.createNotification({
                type: "REPORT", priority: "HIGH", title: "Báo cáo khiếu nại mới",
                message: `Có báo cáo mới cho đơn hàng #${orderId}: ${title}.`,
                targetRole: "Admin"
            }).catch(console.error);
        }

        return report;
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
            throw new NotFoundError("Report not found");
        }

        // Non-admin users can only view their own reports
        if (!isAdmin && report.reporterId?.toString() !== userId?.toString()) {
            throw new ForbiddenError("Not authorized to view this report");
        }

        return report;
    }

    async updateReport(reportId, data, userId) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundError("Report not found");
        }

        // Only reporter can update, and only when PENDING
        if (report.reporterId?.toString() !== userId?.toString()) {
            throw new ForbiddenError("Not authorized to update this report");
        }

        if (report.status !== "PENDING") {
            throw new BadRequestError("Cannot update report when status is not PENDING");
        }

        return this.orderReportRepository.update(reportId, data);
    }

    async deleteReport(reportId, userId) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundError("Report not found");
        }

        // Only reporter can delete, and only when PENDING
        if (report.reporterId?.toString() !== userId?.toString()) {
            throw new ForbiddenError("Not authorized to delete this report");
        }

        if (report.status !== "PENDING") {
            throw new BadRequestError("Cannot delete report when status is not PENDING");
        }

        return this.orderReportRepository.delete(reportId);
    }

    async getAllReports(query = {}) {
        const { page = 1, limit = 10, search, status, sort, assignedStaff } = query;
        let filter = {};

        if (status) filter.status = status;

        // Filter by assignedStaff if provided
        if (assignedStaff) {
            filter.assignedStaff = assignedStaff;
        }

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
            throw new NotFoundError("Report not found");
        }

        const updateData = { status };
        if (adminNote !== undefined) updateData.adminNote = adminNote;

        const updatedReport = await this.orderReportRepository.update(reportId, updateData);
        
        if (this.notificationService) {
            await this.notificationService.createNotification({
                type: "REPORT", priority: "NORMAL", title: "Cập nhật khiếu nại đơn hàng",
                message: `Báo cáo khiếu nại cho đơn hàng #${report.orderId} đã được cập nhật: ${status}.`,
                userId: report.reporterId
            }).catch(console.error);
        }

        return updatedReport;
    }

    async assignStaff(reportId, staffId) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundError("Report not found");
        }

        const updatedReport = await this.orderReportRepository.update(reportId, { assignedStaff: staffId });
        
        if (this.notificationService) {
            await this.notificationService.createNotification({
                type: "REPORT", priority: "NORMAL", title: "Phân công xử lý khiếu nại",
                message: `Bạn đã được phân công xử lý khiếu nại #${reportId}.`,
                userId: staffId
            }).catch(console.error);
        }

        return updatedReport;
    }

    async updateAdminNote(reportId, adminNote) {
        const report = await this.orderReportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundError("Report not found");
        }

        return this.orderReportRepository.update(reportId, { adminNote });
    }

    // Admin delete any report
    async adminDeleteReport(reportId) {
        const report = await this.orderReportRepository.delete(reportId);
        if (!report) {
            throw new NotFoundError("Report not found");
        }
        return report;
    }
}