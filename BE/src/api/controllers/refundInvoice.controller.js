export default class RefundInvoiceController {
    constructor({ refundInvoiceService }) {
        this.refundInvoiceService = refundInvoiceService;
    }

    async getAll(req, res, next) {
        try {
            const query = req.query;
            const result = await this.refundInvoiceService.getAll(query);
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async processRefund(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body; // PROCESSED or REJECTED
            const adminId = req.user.userId;
            const invoice = await this.refundInvoiceService.processRefund(id, status, adminId);
            res.status(200).json({
                status: 'success',
                data: { invoice }
            });
        } catch (error) {
            next(error);
        }
    }

    // Tạm thời fix status
    async fixStatus(req, res, next) {
        try {
            const Order = (await import("../../models/order.js")).default;
            const RefundInvoice = (await import("../../models/RefundInvoice.js")).default;
            
            const invoices = await RefundInvoice.find({ 
                status: { $in: ["PROCESSED", "REJECTED"] }
            });

            let count = 0;
            for (const invoice of invoices) {
                const result = await Order.updateOne(
                    { _id: invoice.orderId },
                    { $set: { orderStatus: invoice.status, isCancelRequested: false } }
                );
                if (result.modifiedCount > 0) {
                    count++;
                }
            }
            res.status(200).json({ message: `Updated ${count} orders successfully!` });
        } catch (error) {
            next(error);
        }
    }
}
