import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * /refund-invoices:
 *   get:
 *     summary: Get all refund invoices
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Refund invoices retrieved
 */
router.get(
    "/",
    authentication,
    checkPermission('Order', 'read'), // Use Order permission for now
    async (req, res, next) => {
        const refundInvoiceController = req.container.resolve("refundInvoiceController");
        await refundInvoiceController.getAll(req, res, next);
    }
);

/**
 * @swagger
 * /refund-invoices/{id}/process:
 *   patch:
 *     summary: Process a refund invoice
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PROCESSED, REJECTED]
 *     responses:
 *       200:
 *         description: Refund invoice processed
 */
router.patch(
    "/:id/process",
    authentication,
    checkPermission('Order', 'update'),
    async (req, res, next) => {
        const refundInvoiceController = req.container.resolve("refundInvoiceController");
        await refundInvoiceController.processRefund(req, res, next);
    }
);

export default router;
