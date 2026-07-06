import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';

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
 *         linkedComboId:
 *           type: string
 *         likeCount:
 *           type: number
 *         saveCount:
 *           type: number
 *         purchaseCount:
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
 *     description: Create a new DIY post. Requires authentication.
 *     tags: [DIYPosts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               creatorId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedComboId:
 *                 type: string
 *     responses:
 *       201:
 *         description: DIY Post created successfully
 */
router.post(
    "/",
    authentication,
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
 *     description: Update an existing DIY post by ID. Requires authentication.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedComboId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: DIY Post updated successfully
 */
router.put(
    "/:id",
    authentication,
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
 *     description: Delete a DIY post by ID. Requires authentication.
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
    async (req, res, next) => {
        const diyPostController = req.container.resolve("diyPostController");
        await diyPostController.deletePost(req, res, next);
    }
);

export default router;
