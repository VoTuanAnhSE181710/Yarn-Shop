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
        } catch (error) {
            next(error);
        }
    }
}
