import express from 'express';
import {
    authentication,
    authorizationByRole,
    validateData,
    verifyDevice,
} from '../middlewares/middleware.js'
import { 
    otlVerifySchema,
    otpSendSchema, 
    otpVerifySchema 
} from '../../validators/mail.validator.js';

const router = express.Router();

/**
 * @swagger
 * /mail/otp/send:
 *   post:
 *     summary: Send OTP to user's email
 *     description: Generate and send a 6-digit OTP code to the authenticated user's email. OTP is valid for 5 minutes. Required before changing password.
 *     tags: [Mail & OTP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must match authenticated user's email)
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "OTP email sent successfully"
 *       400:
 *         description: Bad request - Invalid email or email does not match user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/otp/send",
    authentication,
    verifyDevice,
    validateData(otpSendSchema),
    async (req, res, next) => {
        const mailController = req.container.resolve("mailController");

        await mailController.sendOtp(req, res, next);
    }
)

/**
 * @swagger
 * /mail/otp/verify:
 *   post:
 *     summary: Verify OTP code
 *     description: Verify the 6-digit OTP code sent to user's email. Once verified, user has 10 minutes to change password.
 *     tags: [Mail & OTP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit OTP code received via email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 isValid:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "OTP is invalid or expired!"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/otp/verify",
    authentication,
    verifyDevice,
    validateData(otpVerifySchema),
    async (req, res, next) => {
        const mailController = req.container.resolve("mailController");

        await mailController.verifyOtp(req, res, next);
    }
)

/**
 * @swagger
 * /mail/forgot-password/send:
 *   post:
 *     summary: Send forgot password reset link
 *     description: Send a one-time password reset link to user's email. Link is valid for 30 minutes. No authentication required.
 *     tags: [Mail & OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user who forgot password
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Reset password link sent successfully"
 *       400:
 *         description: Bad request - User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/forgot-password/send",
    validateData(otpSendSchema),
    async (req, res, next) => {
        const mailController = req.container.resolve("mailController");

        await mailController.sendForgotPasswordLink(req, res, next);
    }
)

/**
 * @swagger
 * /mail/forgot-password/verify:
 *   post:
 *     summary: Verify password reset link
 *     description: Verify the one-time link sent to user's email for password reset. Returns user's email if valid.
 *     tags: [Mail & OTP]
 *     parameters:
 *       - in: query
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID from the password reset link
 *         example: "0fe56d08-b490-487e-9358-b1c129b93c03"
 *     responses:
 *       200:
 *         description: Link verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Link verified!"
 *                 isValid:
 *                   type: string
 *                   description: User's email address
 *                   example: "user@example.com"
 *       400:
 *         description: Bad request - Invalid or expired link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "link is invalid or expired!"
 */
router.post(
    "/forgot-password/verify",
    validateData(otlVerifySchema, "query"),
    async (req, res, next) => {
        const mailController = req.container.resolve("mailController");

        await mailController.verifyAccessLinkKey(req, res, next);
    }
)


export default router