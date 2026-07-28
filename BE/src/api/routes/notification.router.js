import express from 'express';
import { authentication } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Notifications retrieved
 */
router.get(
    "/",
    authentication,
    async (req, res, next) => {
        const notificationController = req.container.resolve("notificationController");
        await notificationController.getMyNotifications(req, res, next);
    }
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
    "/:id/read",
    authentication,
    async (req, res, next) => {
        const notificationController = req.container.resolve("notificationController");
        await notificationController.markAsRead(req, res, next);
    }
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Delete a specific notification by ID.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete(
    "/:id",
    authentication,
    async (req, res, next) => {
        const notificationController = req.container.resolve("notificationController");
        await notificationController.deleteNotification(req, res, next);
    }
);

export default router;
