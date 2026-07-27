import express from "express";
import { authentication } from "../middlewares/middleware.js";
import { uploadMessageMedia } from "../../utils/multerStorage.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Real-time user-to-user messaging operations
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a new message (supports text, image, file)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: Provide the MongoDB ObjectId of the receiving user
 *               content:
 *                 type: string
 *                 description: The text content of the message
 *               mediaType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *                 description: Type of the media
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (image/pdf/etc)
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/",
    authentication,
    uploadMessageMedia.single('media'),
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.sendMessage(req, res, next);
    }
);

/**
 * @swagger
 * /messages/{messageId}/revoke:
 *   put:
 *     summary: Revoke a specific message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The message ID
 *     responses:
 *       200:
 *         description: Message revoked successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
    "/:messageId/revoke",
    authentication,
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.revokeMessage(req, res, next);
    }
);

/**
 * @swagger
 * /messages/conversation/{conversationId}:
 *   delete:
 *     summary: Delete an entire conversation with its messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete(
    "/conversation/:conversationId",
    authentication,
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.deleteConversation(req, res, next);
    }
);

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: Get all conversations for the logic user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user conversations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/conversations",
    authentication,
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.getConversations(req, res, next);
    }
);

/**
 * @swagger
 * /messages/{conversationId}:
 *   get:
 *     summary: Get messages from a specific conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get(
    "/:conversationId",
    authentication,
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.getMessages(req, res, next);
    }
);

/**
 * @swagger
 * /messages/{conversationId}/read:
 *   put:
 *     summary: Mark all unread messages in a conversation as read by the current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully marked as read
 *       401:
 *         description: Unauthorized
 */
router.put(
    "/:conversationId/read",
    authentication,
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.markAsRead(req, res, next);
    }
);

/**
 * @swagger
 * /messages/group:
 *   post:
 *     summary: Create a new group chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - participantIds
 *             properties:
 *               name:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of ObjectIds to add directly to group
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post(
    "/group",
    authentication,
    async (req, res, next) => {
        const messageController = req.container.resolve("messageController");
        await messageController.createGroupChat(req, res, next);
    }
);

export default router;