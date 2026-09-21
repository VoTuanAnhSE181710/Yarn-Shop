import express from 'express';
import { createPayment, createVNPayPayment, handleVNPayIPN, handleMomoIPN } from '../controllers/payment.controller.js';
import { authentication, authorizationByRole } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - orderId
 *       properties:
 *         orderId:
 *           type: string
 *           description: ID of the order to pay
 *           example: "64f1b2c3e4b0c1a2d3e4f5g6"
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         payUrl:
 *           type: string
 *           description: Redirect URL to the payment gateway
 *     VNPayIPNResponse:
 *       type: object
 *       properties:
 *         RspCode:
 *           type: string
 *           description: Response code (00 = success)
 *         Message:
 *           type: string
 */

/**
 * @swagger
 * /payment/momo-payment:
 *   post:
 *     summary: Create MoMo Payment Link
 *     description: Create a payment request via MoMo. Returns a URL to redirect the user to the MoMo payment page.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: MoMo payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Invalid amount or MoMo error
 *       500:
 *         description: Internal server error
 */
router.post('/momo-payment', authentication, authorizationByRole(['Admin']), createPayment);

/**
 * @swagger
 * /payment/vnpay-payment:
 *   post:
 *     summary: Create VNPay Payment Link
 *     description: Create a payment request via VNPay. Returns a URL to redirect the user to the VNPay payment page.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: VNPay payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Invalid amount
 *       500:
 *         description: Internal server error
 */
router.post('/vnpay-payment', authentication, authorizationByRole(['Admin']), createVNPayPayment);

/**
 * @swagger
 * /payment/vnpay-ipn:
 *   get:
 *     summary: VNPay IPN Webhook - Receive payment result
 *     description: |
 *       VNPay calls this endpoint after the user completes payment.
 *       The system validates the signature and updates the order status.
 *       This endpoint is called automatically by VNPay (server-to-server), not by the user.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Payment amount (* 100)
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Bank code
 *       - in: query
 *         name: vnp_BankTranNo
 *         schema:
 *           type: string
 *         description: Bank transaction number
 *       - in: query
 *         name: vnp_CardType
 *         schema:
 *           type: string
 *         description: Card type
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Order information
 *       - in: query
 *         name: vnp_PayDate
 *         schema:
 *           type: string
 *         description: Payment date (yyyyMMddHHmmss)
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Response code (00 = success)
 *       - in: query
 *         name: vnp_TmnCode
 *         schema:
 *           type: string
 *         description: Terminal code
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: VNPay transaction number
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Order reference code
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Secure hash (checksum)
 *     responses:
 *       200:
 *         description: IPN response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VNPayIPNResponse'
 */
router.get('/vnpay-ipn', handleVNPayIPN);

/**
 * @swagger
 * /payment/momo/ipn:
 *   post:
 *     summary: MoMo IPN Webhook
 *     tags: [Payment]
 */
router.post('/momo/ipn', handleMomoIPN);

export default router;