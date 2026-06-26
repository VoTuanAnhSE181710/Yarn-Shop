import express from 'express';
import { createPayment, createVNPayPayment, handleVNPayIPN } from '../controllers/payment.controller.js';

const router = express.Router();

// MoMo
router.post('/momo-payment', createPayment);

// VNPay
router.post('/vnpay-payment', createVNPayPayment);
router.get('/vnpay-ipn', handleVNPayIPN);

export default router;