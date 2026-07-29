import RefundInvoice from "../models/RefundInvoice.js";
import { NotFoundError, BadRequestError } from "../error/error.js";

export default class RefundInvoiceService {
    constructor({ logRepository, notificationService }) {
        this.logRepository = logRepository;
        this.notificationService = notificationService;
    }

    async getAll(query) {
        const { page = 1, limit = 10, status } = query;
        let filter = {};
        if (status) filter.status = status.toUpperCase();

        const invoices = await RefundInvoice.find(filter)
            .populate('orderId', 'orderStatus totalPrice')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await RefundInvoice.countDocuments(filter);
        return {
            invoices,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    async processRefund(id, status, adminId) {
        if (!["PROCESSED", "REJECTED"].includes(status)) {
            throw new BadRequestError("Status must be PROCESSED or REJECTED");
        }
        const invoice = await RefundInvoice.findByIdAndUpdate(id, {
            status,
            processedBy: adminId,
            processedAt: new Date()
        }, { new: true });
        
        if (!invoice) {
            throw new NotFoundError("Refund Invoice not found");
        }
        
        // Update the order status when refund is processed/rejected
        const Order = (await import("../models/order.js")).default;
        await Order.findByIdAndUpdate(invoice.orderId, { orderStatus: status, isCancelRequested: false });
        
        if (this.notificationService) {
            const messageStr = status === "PROCESSED" 
                ? `Yêu cầu hoàn tiền cho đơn hàng của bạn đã được xử lý thành công.` 
                : `Yêu cầu hoàn tiền cho đơn hàng của bạn đã bị từ chối.`;
            
            await this.notificationService.createAndEmitNotification({
                type: "ORDER",
                priority: "NORMAL",
                title: "Cập nhật yêu cầu hoàn tiền",
                message: messageStr,
                userId: invoice.userId
            }).catch(console.error);
        }
        
        if (this.logRepository) {
            await this.logRepository.saveLog({
                action: "UPDATE",
                targetType: "ORDER", // Refund invoices are related to orders
                outcome: "SUCCESS",
                actorId: adminId,
                details: { refundInvoiceId: invoice._id, orderId: invoice.orderId, status }
            });
        }
        
        return invoice;
    }
}
