import express from 'express';
import { createPayment, createVNPayPayment, handleVNPayIPN } from '../controllers/payment.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           description: Số tiền thanh toán (VND)
 *           example: 50000
 *         orderInfo:
 *           type: string
 *           description: Thông tin đơn hàng
 *           example: "Thanh toan don hang Yarn Shop"
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         payUrl:
 *           type: string
 *           description: URL chuyển hướng đến cổng thanh toán
 *     VNPayIPNResponse:
 *       type: object
 *       properties:
 *         RspCode:
 *           type: string
 *           description: Mã phản hồi (00 = thành công)
 *         Message:
 *           type: string
 */

/**
 * @swagger
 * /payment/momo-payment:
 *   post:
 *     summary: Tạo link thanh toán MoMo
 *     description: Tạo yêu cầu thanh toán qua MoMo. Trả về URL để chuyển hướng người dùng đến trang thanh toán MoMo.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Tạo liên kết thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Số tiền không hợp lệ hoặc lỗi từ MoMo
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/momo-payment', createPayment);

/**
 * @swagger
 * /payment/vnpay-payment:
 *   post:
 *     summary: Tạo link thanh toán VNPay
 *     description: Tạo yêu cầu thanh toán qua VNPay. Trả về URL để chuyển hướng người dùng đến cổng thanh toán VNPay.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Tạo link thanh toán VNPay thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Số tiền không hợp lệ
 *       500:
 *         description: Lỗi Server
 */
router.post('/vnpay-payment', createVNPayPayment);

/**
 * @swagger
 * /payment/vnpay-ipn:
 *   get:
 *     summary: Webhook nhận kết quả thanh toán từ VNPay
 *     description: |
 *       VNPay gọi endpoint này sau khi người dùng hoàn tất thanh toán.
 *       Hệ thống sẽ xác thực chữ ký và cập nhật trạng thái đơn hàng.
 *       Endpoint này được VNPay gọi tự động (server-to-server), không phải do người dùng gọi.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Số tiền thanh toán (* 100)
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Mã ngân hàng
 *       - in: query
 *         name: vnp_BankTranNo
 *         schema:
 *           type: string
 *         description: Mã giao dịch tại ngân hàng
 *       - in: query
 *         name: vnp_CardType
 *         schema:
 *           type: string
 *         description: Loại thẻ
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Thông tin đơn hàng
 *       - in: query
 *         name: vnp_PayDate
 *         schema:
 *           type: string
 *         description: Ngày thanh toán (yyyyMMddHHmmss)
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Mã phản hồi (00 = thành công)
 *       - in: query
 *         name: vnp_TmnCode
 *         schema:
 *           type: string
 *         description: Mã terminal
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: Mã giao dịch VNPay
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Mã tham chiếu đơn hàng
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Chữ ký bảo mật (checksum)
 *     responses:
 *       200:
 *         description: Phản hồi IPN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VNPayIPNResponse'
 */
router.get('/vnpay-ipn', handleVNPayIPN);

export default router;