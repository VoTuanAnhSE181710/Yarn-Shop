import RefundInvoice from "../models/RefundInvoice.js";
import { NotFoundError, BadRequestError } from "../error/error.js";

export default class RefundInvoiceService {
    async getAll(query) {
        const { page = 1, limit = 10, status } = query;
        let filter = {};
        if (status) filter.status = status;

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
        return invoice;
    }
}
