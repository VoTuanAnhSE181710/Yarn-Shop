import express from 'express';
import { authentication, validateData } from '../middlewares/middleware.js';
import { requireSubscription, requireCanCreateVideoType } from '../middlewares/subscription.middleware.js';
import { createVideoSchema, updateVideoSchema, videoQuerySchema } from '../../validators/video.validator.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [community, premium]
 *         url:
 *           type: string
 *         thumbnail:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             publicId:
 *               type: string
 *         duration:
 *           type: number
 *         uploader:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *             fullName:
 *               type: string
 *         category:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         viewCount:
 *           type: number
 *         isActive:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateVideoRequest:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - url
 *       properties:
 *         title:
 *           type: string
 *           description: Video title
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [community, premium]
 *         url:
 *           type: string
 *         thumbnail:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             publicId:
 *               type: string
 *         duration:
 *           type: number
 *         category:
 *           type: string
 *           description: Category ObjectId
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get videos list
 *     description: Get paginated list of community videos. All authenticated users can access.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [community, premium]
 *         description: Filter by video type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ObjectId
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title/description/tags
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, most_viewed]
 *           default: newest
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Video'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/",
    authentication,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getAll(req, res, next);
    }
)

/**
 * @swagger
 * /videos/premium:
 *   get:
 *     summary: Get premium videos
 *     description: Get premium videos. Only Premium subscription users can access.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
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
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, most_viewed]
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *       403:
 *         description: Forbidden - Premium subscription required
 */
router.get(
    "/premium",
    authentication,
    requireSubscription("Premium"),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getPremiumVideos(req, res, next);
    }
)

/**
 * @swagger
 * /videos/my:
 *   get:
 *     summary: Get my uploaded videos
 *     description: Get videos uploaded by the current authenticated user.
 *     tags: [Videos]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 */
router.get(
    "/my",
    authentication,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getMyVideos(req, res, next);
    }
)

/**
 * @swagger
 * /videos:
 *   post:
 *     summary: Create a video
 *     description: |
 *       Create a new video.
 *       - Freemium users can create 'community' videos only
 *       - Premium users can create 'community' videos
 *       - Staff can create 'premium' videos
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVideoRequest'
 *     responses:
 *       201:
 *         description: Video created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    authentication,
    validateData(createVideoSchema, "body"),
    requireCanCreateVideoType(),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.create(req, res, next);
    }
)

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     description: Get detailed information of a specific video.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ObjectId
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *       404:
 *         description: Video not found
 */
router.get(
    "/:id",
    authentication,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getById(req, res, next);
    }
)

/**
 * @swagger
 * /videos/{id}:
 *   patch:
 *     summary: Update video
 *     description: Update video information. Only the uploader or Staff can update.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVideoRequest'
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Video not found
 */
router.patch(
    "/:id",
    authentication,
    validateData(updateVideoSchema, "body"),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.update(req, res, next);
    }
)

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete video
 *     description: Soft delete a video. Only the uploader or Staff can delete.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Video not found
 */
router.delete(
    "/:id",
    authentication,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.delete(req, res, next);
    }
)

export default router;