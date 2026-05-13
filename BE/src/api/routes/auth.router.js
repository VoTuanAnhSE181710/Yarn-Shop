import express from 'express';
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema } from '../../validators/user.validator.js';
import { authentication, authorizationByRole, checkPermission, validateData, verifyDevice } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return access token and refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", validateData(loginSchema), async (req, res, next) => {
    const authController = req.container.resolve("authController");

    await authController.login(req, res, next);
})

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account. Only Admin can register new users (Staff or Customer).
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Bad request - Validation error or user already exists
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
 *       403:
 *         description: Forbidden - Only Admin can register users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/register", 
    validateData(registerSchema, "body"),
    authentication,
    checkPermission('User', 'create'),
    // authorizationByRole(["Admin"]),
    verifyDevice,
    async (req, res, next) => {
        const authController = req.container.resolve("authController");

        await authController.register(req, res, next);
    }
)

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generate new access token and refresh token using current refresh token. Implements token rotation - old refresh token will be revoked.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         description: Bad request - Refresh token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid, expired, or revoked refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/refresh-token", async (req, res, next) => {
    const authController = req.container.resolve("authController");

    await authController.refreshToken(req, res, next);
})

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change user password
 *     description: Change user's password after OTP verification. User must verify OTP first before changing password.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - email
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Current password
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *                 example: "newPassword123"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email (must match authenticated user's email)
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Password has been changed successfully"
 *       400:
 *         description: Bad request - Invalid input, OTP not verified, or incorrect old password
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
router.patch(
    "/change-password",
    authentication,
    verifyDevice,
    validateData(changePasswordSchema),
    async (req, res, next) => {
        const authController = req.container.resolve("authController");

        await authController.changePassword(req, res, next);
    }
)

/**
 * @swagger
 * /auth/forgot-password:
 *   patch:
 *     summary: Reset forgotten password
 *     description: Reset user's password using verified reset link. User must verify the reset link first via /mail/forgot-password/verify endpoint.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uuid
 *               - newPassword
 *             properties:
 *               uuid:
 *                 type: string
 *                 format: uuid
 *                 description: UUID from the verified password reset link
 *                 example: "0fe56d08-b490-487e-9358-b1c129b93c03"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "Password has been reset successfully"
 *       400:
 *         description: Bad request - Invalid link, link expired, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    "/forgot-password",
    validateData(forgotPasswordSchema),
    async (req, res, next) => {
        const authController = req.container.resolve("authController");

        await authController.forgotPassword(req, res, next);
    }
)

/**
 * @swagger
 * /auth/logout:
 *   delete:
 *     summary: User logout
 *     description: Logout user by revoking refresh token for current device. Requires authentication and device verification.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "logout successfully"
 *       400:
 *         description: Bad request - Cannot logout
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
router.delete(
    "/logout",
    authentication,
    verifyDevice,
    async (req, res ,next) => {
        const authController = req.container.resolve("authController")

        await authController.logout(req, res, next);
    }
)

export default router;