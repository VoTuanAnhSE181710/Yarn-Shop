import express from "express";
import { authentication, checkPermission, verifyDevice } from "../middlewares/middleware.js";

const router = express.Router();

/**
 * @swagger
 * /logs:
 *   get:
 *     tags:
 *       - Logs
 *     summary: Get all logs with filtering and pagination
 *     description: Retrieve system logs with optional filters for action, targetType, outcome, and actorId. Supports pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [REGISTER, LOGIN, UPDATE, DELETE, CREATE, GET, RECEIVE_INVENTORY]
 *         description: Filter by action type
 *         example: CREATE
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [USER, WAREHOUSE, ROLE, PERMISSION, INVENTORY]
 *         description: Filter by target resource type
 *         example: USER
 *       - in: query
 *         name: outcome
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILED]
 *         description: Filter by action outcome
 *         example: SUCCESS
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *         description: Filter by user ID who performed the action
 *         example: 65be000000000000000001
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of logs per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetLogsResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", authentication, verifyDevice, checkPermission('Log', 'read'), (req, res, next) => {
    req.container.resolve("logController").getLogs(req, res, next);
});

/**
 * @swagger
 * /logs/statistics:
 *   get:
 *     tags: [Logs]
 *     summary: Get log statistics
 *     description: Get statistics about system logs including totals and distribution by action/outcome
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get("/statistics",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const logController = req.container.resolve("logController");
        await logController.getStatistics(req, res, next);
    }
)

export default router;