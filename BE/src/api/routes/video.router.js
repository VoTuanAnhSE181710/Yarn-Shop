import express from 'express';
import { authentication, verifyDevice, checkPermission } from '../middlewares/middleware.js';
import { uploadVideo } from '../../utils/multerStorage.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management API
 */

/**
 * @swagger
 * /videos/upload:
 *   post:
 *     summary: Upload a video file to Cloudinary
 *     description: Upload a video file. This returns the Cloudinary URL needed to create a video entry. Max 500MB.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: The video file to upload (mp4, mov, avi, webm, mkv)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/..."
 *                     publicId:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     size:
 *                       type: number
 *                     mimetype:
 *                       type: string
 */
router.post(
    "/upload",
    authentication,
    verifyDevice,
    uploadVideo.single('video'),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.uploadFile(req, res, next);
    }
);

/**
 * @swagger
 * /videos:
 *   post:
 *     summary: Create a new video entry
 *     description: Create a new video with metadata and attached products/kits.
 *     tags: [Videos]
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
 *               - type
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 example: "How to crochet a bear"
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [community, premium]
 *                 example: community
 *               url:
 *                 type: string
 *                 example: "https://res.cloudinary.com/..."
 *               category:
 *                 type: string
 *                 description: Category ObjectId
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["crochet", "bear"]
 *               attachedProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Product ObjectIds
 *               attachedKits:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Kit ObjectIds
 *     responses:
 *       201:
 *         description: Video created successfully
 */
router.post(
    "/",
    authentication,
    verifyDevice,
    uploadVideo.single('video'),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.create(req, res, next);
    }
);

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos
 *     description: Retrieve a paginated list of videos.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [community, premium]
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
 *           default: newest
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 */
router.get(
    "/",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getAll(req, res, next);
    }
);

/**
 * @swagger
 * /videos/premium:
 *   get:
 *     summary: Get premium videos
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
 *         description: Premium videos retrieved successfully
 */
router.get(
    "/premium",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getPremiumVideos(req, res, next);
    }
);

/**
 * @swagger
 * /videos/my:
 *   get:
 *     summary: Get my uploaded videos
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
 *         description: My videos retrieved successfully
 */
router.get(
    "/my",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getMyVideos(req, res, next);
    }
);

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get video details by ID
 *     description: Retrieve detailed information about a video. This automatically increments the view count.
 *     tags: [Videos]
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
 *         description: Video details retrieved
 */
router.get(
    "/:id",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.getById(req, res, next);
    }
);

/**
 * @swagger
 * /videos/{id}/rate:
 *   post:
 *     summary: Rate a video
 *     description: Rate a video from 1 to 5 stars. Re-rating overrides the previous score.
 *     tags: [Videos]
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
 *               - score
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       200:
 *         description: Rated successfully
 */
router.post(
    "/:id/rate",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.rate(req, res, next);
    }
);

/**
 * @swagger
 * /videos/{id}:
 *   patch:
 *     summary: Update own video
 *     description: Update video details. Only the uploader can perform this action.
 *     tags: [Videos]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               attachedProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *               attachedKits:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 */
router.patch(
    "/:id",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.update(req, res, next);
    }
);

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete own video
 *     description: Soft delete a video. Only the uploader can perform this action.
 *     tags: [Videos]
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
 *         description: Video deleted successfully
 */
router.delete(
    "/:id",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.delete(req, res, next);
    }
);

/**
 * @swagger
 * /videos/admin-update/{id}:
 *   patch:
 *     summary: Admin update a video
 *     description: Update video details. Requires checkPermission('Video', 'update').
 *     tags: [Videos]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               attachedProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *               attachedKits:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 */
router.patch(
    "/admin-update/:id",
    authentication,
    verifyDevice,
    checkPermission('Video', 'update'),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.adminUpdate(req, res, next);
    }
);

/**
 * @swagger
 * /videos/admin-delete/{id}:
 *   delete:
 *     summary: Admin delete a video
 *     description: Soft delete a video. Requires checkPermission('Video', 'delete').
 *     tags: [Videos]
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
 *         description: Video deleted successfully
 */
router.delete(
    "/admin-delete/:id",
    authentication,
    verifyDevice,
    checkPermission('Video', 'delete'),
    async (req, res, next) => {
        const videoController = req.container.resolve("videoController");
        await videoController.adminDelete(req, res, next);
    }
);

export default router;
