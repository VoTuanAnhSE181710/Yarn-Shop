import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';
import { uploadSupportDIY } from '../../utils/multerStorage.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SupportDIY:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         creatorId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         linkedProduct:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *         linkedCombo:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               comboId:
 *                 type: string
 *         likeCount:
 *           type: number
 *         purchaseCount:
 *           type: number
 *         price:
 *           type: number
 *         status:
 *           type: string
 *           enum: ["Pending", "Done", "Cancel"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /support-diy:
 *   get:
 *     summary: Get all Support DIY posts
 *     description: Retrieve a list of Support DIY posts. Public access.
 *     tags: [SupportDIY]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status ("Pending", "Done", "Cancel")
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: linkedComboId
 *         schema:
 *           type: string
 *       - in: query
 *         name: linkedProductId
 *         schema:
 *           type: string
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
 *         description: A list of Support DIY posts
 */
router.get(
    "/",
    async (req, res, next) => {
        const supportDIYController = req.container.resolve("supportDIYController");
        await supportDIYController.getAllPosts(req, res, next);
    }
);

/**
 * @swagger
 * /support-diy:
 *   post:
 *     summary: Create a Support DIY post
 *     description: Create a new Support DIY post. Requires authentication and SupportDIY create permission. Supports file upload for images.
 *     tags: [SupportDIY]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 description: 'JSON object containing post data (title, description, tags, linkedProduct, linkedCombo, price)'
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   linkedProduct:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                         variantId:
 *                           type: string
 *                   linkedCombo:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         comboId:
 *                           type: string
 *                   price:
 *                     type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Post images (upload multiple files)
 *     responses:
 *       201:
 *         description: Support DIY Post created successfully
 */
router.post(
    "/",
    authentication,
    checkPermission('SupportDIY', 'create'),
    uploadSupportDIY.any(),
    (req, res, next) => {
        try {
            if (!req.body.data && !req.body.title) {
                // If no 'data' field, try to use req.body directly
                next();
                return;
            }
            
            if (req.body.data) {
                let postData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
                
                // Attach uploaded image paths
                if (req.files && req.files.length > 0) {
                    const imagePaths = req.files.map(f => f.path);
                    if (!postData.images) postData.images = [];
                    postData.images.push(...imagePaths);
                }
                
                req.body = postData;
            } else if (req.files && req.files.length > 0) {
                if (!req.body.images) req.body.images = [];
                req.body.images.push(...req.files.map(f => f.path));
            }
            
            next();
        } catch (error) {
            return res.status(400).json({
                status: "error",
                message: "Invalid form data format. Make sure 'data' is valid JSON.",
                error: error.message
            });
        }
    },
    async (req, res, next) => {
        const supportDIYController = req.container.resolve("supportDIYController");
        await supportDIYController.createPost(req, res, next);
    }
);

/**
 * @swagger
 * /support-diy/{id}:
 *   get:
 *     summary: Get a Support DIY post by ID
 *     description: Retrieve detailed information about a specific Support DIY post. Public access.
 *     tags: [SupportDIY]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Support DIY Post details
 */
router.get(
    "/:id",
    async (req, res, next) => {
        const supportDIYController = req.container.resolve("supportDIYController");
        await supportDIYController.getPostById(req, res, next);
    }
);

/**
 * @swagger
 * /support-diy/{id}:
 *   put:
 *     summary: Update a Support DIY post
 *     description: Update an existing Support DIY post by ID. Requires authentication and SupportDIY update permission. Supports file upload for images.
 *     tags: [SupportDIY]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 description: 'JSON object containing fields to update'
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   linkedProduct:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                         variantId:
 *                           type: string
 *                   linkedCombo:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         comboId:
 *                           type: string
 *                   price:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: ["Pending", "Done", "Cancel"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Support DIY Post updated successfully
 */
router.put(
    "/:id",
    authentication,
    checkPermission('SupportDIY', 'update'),
    uploadSupportDIY.any(),
    (req, res, next) => {
        try {
            if (req.body.data) {
                let postData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
                
                if (req.files && req.files.length > 0) {
                    const imagePaths = req.files.map(f => f.path);
                    if (!postData.images) postData.images = [];
                    postData.images.push(...imagePaths);
                }
                
                req.body = postData;
            } else if (req.files && req.files.length > 0) {
                if (!req.body.images) req.body.images = [];
                req.body.images.push(...req.files.map(f => f.path));
            }
            
            next();
        } catch (error) {
            return res.status(400).json({
                status: "error",
                message: "Invalid form data format. Make sure 'data' is valid JSON.",
                error: error.message
            });
        }
    },
    async (req, res, next) => {
        const supportDIYController = req.container.resolve("supportDIYController");
        await supportDIYController.updatePost(req, res, next);
    }
);

/**
 * @swagger
 * /support-diy/{id}:
 *   delete:
 *     summary: Delete a Support DIY post
 *     description: Delete a Support DIY post by ID. Requires authentication and SupportDIY delete permission.
 *     tags: [SupportDIY]
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
 *         description: Support DIY Post deleted successfully
 */
router.delete(
    "/:id",
    authentication,
    checkPermission('SupportDIY', 'delete'),
    async (req, res, next) => {
        const supportDIYController = req.container.resolve("supportDIYController");
        await supportDIYController.deletePost(req, res, next);
    }
);

/**
 * @swagger
 * /support-diy/{id}/status:
 *   patch:
 *     summary: Update Support DIY post status
 *     description: Update the status of a Support DIY post. Requires authentication and SupportDIY update permission.
 *     tags: [SupportDIY]
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
 *                 enum: ["Pending", "Done", "Cancel"]
 *     responses:
 *       200:
 *         description: Support DIY Post status updated successfully
 *       400:
 *         description: Invalid status
 */
router.patch(
    "/:id/status",
    authentication,
    checkPermission('SupportDIY', 'update'),
    async (req, res, next) => {
        const supportDIYController = req.container.resolve("supportDIYController");
        await supportDIYController.updateStatus(req, res, next);
    }
);

export default router;
