import express from 'express';
import { authentication } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MembershipData:
 *       type: object
 *       properties:
 *         userId: { type: string }
 *         points: { type: number, example: 650 }
 *         rank: { type: string, enum: [member, silver, gold, diamond] }
 *         totalSpent: { type: number, example: 12000000 }
 *         coinBalance: { type: number, example: 12500 }
 *         updatedAt: { type: string, format: date-time }
 *     MembershipHistoryEntry:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         date: { type: string, format: date-time }
 *         points: { type: number, example: 507 }
 *         source: { type: string, enum: [purchase, diy_video, registration, rank_up, course_complete] }
 *         description: { type: string }
 *         orderId: { type: string, description: 'Order / DIY post / course id the entry refers to' }
 *         orderAmount: { type: number, example: 507000 }
 *         newRank: { type: string, enum: [member, silver, gold, diamond], description: 'Present when this entry caused a rank up' }
 *         status: { type: string, enum: [completed, pending, cancelled] }
 *     CoinTransaction:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         date: { type: string, format: date-time }
 *         amount: { type: number, description: 'Positive for earned, negative for used/expired', example: 15210 }
 *         type: { type: string, enum: [earned, used, expired] }
 *         description: { type: string }
 *         orderId: { type: string }
 *         expiryDate: { type: string, format: date-time }
 *     MembershipPagination:
 *       type: object
 *       properties:
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 *         total: { type: integer, example: 42 }
 */

/**
 * @swagger
 * /membership/config:
 *   get:
 *     summary: Membership rank thresholds and coin rules
 *     description: Rank minPoints / coinRewardPercent, COIN_RULES and point rules used by the backend.
 *     tags: [Membership]
 *     responses:
 *       200:
 *         description: Membership configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     ranks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank: { type: string, example: silver }
 *                           displayName: { type: string, example: Silver }
 *                           minPoints: { type: number, example: 1000 }
 *                           coinRewardPercent: { type: number, example: 4 }
 *                     coinRules:
 *                       type: object
 *                       properties:
 *                         exchangeRate: { type: number, example: 1 }
 *                         maxUsagePercent: { type: number, example: 20 }
 *                         minOrderForCoin: { type: number, example: 100000 }
 *                         expiryMonths: { type: number, example: 6 }
 *                     pointRules: { type: object }
 */
router.get(
    "/config",
    async (req, res, next) => {
        const membershipController = req.container.resolve("membershipController");
        await membershipController.getConfig(req, res, next);
    }
);

/**
 * @swagger
 * /membership/me:
 *   get:
 *     summary: Get my membership overview
 *     description: |
 *       Returns membership data plus the latest point history and coin transactions
 *       (one call for the FE store `initialize()`). Creates the membership with the
 *       signup bonus on first access and expires past-due coin.
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *         description: Number of history / coin entries to include
 *     responses:
 *       200:
 *         description: Membership overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership: { $ref: '#/components/schemas/MembershipData' }
 *                     history:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MembershipHistoryEntry' }
 *                     coinTransactions:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/CoinTransaction' }
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get(
    "/me",
    authentication,
    async (req, res, next) => {
        const membershipController = req.container.resolve("membershipController");
        await membershipController.getMyMembership(req, res, next);
    }
);

/**
 * @swagger
 * /membership/me/history:
 *   get:
 *     summary: Get my point history (paginated)
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *     responses:
 *       200:
 *         description: Point history page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MembershipHistoryEntry' }
 *                     pagination: { $ref: '#/components/schemas/MembershipPagination' }
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get(
    "/me/history",
    authentication,
    async (req, res, next) => {
        const membershipController = req.container.resolve("membershipController");
        await membershipController.getMyHistory(req, res, next);
    }
);

/**
 * @swagger
 * /membership/me/coins:
 *   get:
 *     summary: Get my coin transactions (paginated)
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *     responses:
 *       200:
 *         description: Coin transactions page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     coinTransactions:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/CoinTransaction' }
 *                     pagination: { $ref: '#/components/schemas/MembershipPagination' }
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get(
    "/me/coins",
    authentication,
    async (req, res, next) => {
        const membershipController = req.container.resolve("membershipController");
        await membershipController.getMyCoinTransactions(req, res, next);
    }
);

export default router;
