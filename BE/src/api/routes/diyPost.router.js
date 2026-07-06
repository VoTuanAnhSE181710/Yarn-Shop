import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';
import { uploadDIYPost } from '../../utils/multerStorage.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DIYPost:
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
 *           enum: [pending, approved, rejected]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /diy-posts:
 *   get:
 *     summary: Get all DIY posts
 *     description: Retrieve a list of DIY posts. Public access.
 *     tags: [DIYPosts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (pending, approved, rejected)
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
 *         description: A list of DIY posts
 */
router.get(
    "/",
    async (req, res, next) => {
        const diyPostController = req.container.resolve("diyPostController");
        await diyPostController.getAllPosts(req, res, next);
    }
);

/**
 * @swagger
 * /diy-posts:
 *   post:
 *     summary: Create a DIY post
 *     description: Create a new DIY post. Requires authentication and DIYPost create permission. Supports file upload for images.
 *     tags: [DIYPosts]
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
 *         description: DIY Post created successfully
 */
router.post(
    "/",
    authentication,
    checkPermission('DIYPost', 'create'),
    uploadDIYPost.any(),
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
        const diyPostController = req.container.resolve("diyPostController");
        await diyPostController.createPost(req, res, next);
    }
);

/**
 * @swagger
 * /diy-posts/{id}:
 *   get:
 *     summary: Get a DIY post by ID
 *     description: Retrieve detailed information about a specific DIY post. Public access.
 *     tags: [DIYPosts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DIY Post details
 */
router.get(
    "/:id",
    async (req, res, next) => {
        const diyPostController = req.container.resolve("diyPostController");
        await diyPostController.getPostById(req, res, next);
    }
);

/**
 * @swagger
 * /diy-posts/{id}:
 *   put:
 *     summary: Update a DIY post
 *     description: Update an existing DIY post by ID. Requires authentication and DIYPost update permission. Supports file upload for images.
 *     tags: [DIYPosts]
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
 *                     enum: [pending, approved, rejected]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: DIY Post updated successfully
 */
router.put(
    "/:id",
    authentication,
    checkPermission('DIYPost', 'update'),
    uploadDIYPost.any(),
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
        const diyPostController = req.container.resolve("diyPostController");
        await diyPostController.updatePost(req, res, next);
    }
);

/**
 * @swagger
 * /diy-posts/{id}:
 *   delete:
 *     summary: Delete a DIY post
 *     description: Delete a DIY post by ID. Requires authentication and DIYPost delete permission.
 *     tags: [DIYPosts]
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
 *         description: DIY Post deleted successfully
 */
router.delete(
    "/:id",
    authentication,
    checkPermission('DIYPost', 'delete'),
    async (req, res, next) => {
        const diyPostController = req.container.resolve("diyPostController");
        await diyPostController.deletePost(req, res, next);
    }
);

export default router;