import { Router } from "express";
import { authentication, authorizationByRole, validateData } from "../middlewares/middleware.js";
import {
    createUploadUrlSchema,
    confirmUploadSchema,
    myVideosQuerySchema,
    updateVideoSchema,
    replaceVideoSchema,
} from "../../validators/video.validator.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management endpoints
 */

/**
 * @swagger
 * /videos/upload-url:
 *   post:
 *     summary: Get presigned upload URL for a new video
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
 *               - filename
 *               - mimeType
 *               - size
 *               - title
 *             properties:
 *               filename:
 *                 type: string
 *                 example: "my-lesson-video.mp4"
 *               mimeType:
 *                 type: string
 *                 example: "video/mp4"
 *               size:
 *                 type: number
 *                 example: 104857600
 *               title:
 *                 type: string
 *                 example: "Bài học 01 - Giới thiệu"
 *               description:
 *                 type: string
 *                 example: "Mô tả video"
 *               visibility:
 *                 type: string
 *                 enum: [public, private, unlisted]
 *                 default: private
 *     responses:
 *       201:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: string
 *                   example: "vid_abc123"
 *                 uploadUrl:
 *                   type: string
 *                   example: "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=..."
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-06-28T11:00:00Z"
 *       400:
 *         description: Invalid mimeType or size exceeds limit
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/upload-url",
    authentication,
    validateData(createUploadUrlSchema, "body"),
    (req, res, next) => req.container.resolve("videoController").getUploadUrl(req, res, next)
);

/**
 * @swagger
 * /videos/{videoId}/confirm:
 *   post:
 *     summary: Confirm upload is complete
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duration
 *             properties:
 *               duration:
 *                 type: number
 *                 example: 325
 *                 description: Video duration in seconds
 *     responses:
 *       200:
 *         description: Upload confirmed, video is processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "vid_abc123"
 *                 status:
 *                   type: string
 *                   example: "processing"
 *                 title:
 *                   type: string
 *                   example: "Bài học 01 - Giới thiệu"
 *                 videoUrl:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Video not found
 */
router.post(
    "/:videoId/confirm",
    authentication,
    validateData(confirmUploadSchema, "body"),
    (req, res, next) => req.container.resolve("videoController").confirmUpload(req, res, next)
);

/**
 * @swagger
 * /videos/my:
 *   get:
 *     summary: Get current user's videos
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploading, processing, ready, failed]
 *         description: Filter by status
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private, unlisted]
 *         description: Filter by visibility
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
 *         description: List of user's videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       thumbnailUrl:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       status:
 *                         type: string
 *                       visibility:
 *                         type: string
 *                       viewCount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get(
    "/my",
    authentication,
    validateData(myVideosQuerySchema, "query"),
    (req, res, next) => req.container.resolve("videoController").getMyVideos(req, res, next)
);

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get video detail
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 uploaderUId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 videoUrl:
 *                   type: string
 *                 thumbnailUrl:
 *                   type: string
 *                 duration:
 *                   type: number
 *                 size:
 *                   type: number
 *                 mimeType:
 *                   type: string
 *                 status:
 *                   type: string
 *                 visibility:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 viewCount:
 *                   type: number
 *                 linkedLessonId:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: No permission to view private video
 *       404:
 *         description: Video not found
 */
router.get(
    "/:id",
    (req, res, next) => {
        // Optional authentication - try to decode token but don't fail
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const tokenService = req.container.resolve("tokenService");
                const accessToken = authHeader.split(" ")[1];
                if (accessToken) {
                    const decode = tokenService.verifyAccessToken({ token: accessToken });
                    if (decode) {
                        req.user = decode;
                    }
                }
            } catch (err) {
                // Token invalid or expired - continue without user
            }
        }
        next();
    },
    (req, res, next) => req.container.resolve("videoController").getById(req, res, next)
);

/**
 * @swagger
 * /videos/{id}:
 *   put:
 *     summary: Update video metadata
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Tên mới"
 *               description:
 *                 type: string
 *                 example: "Mô tả mới"
 *               visibility:
 *                 type: string
 *                 enum: [public, private, unlisted]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["react", "hooks"]
 *               linkedLessonId:
 *                 type: string
 *                 nullable: true
 *                 example: "lesson_002"
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       403:
 *         description: Not the owner or admin/staff
 *       404:
 *         description: Video not found
 *       422:
 *         description: Video not ready yet
 */
router.put(
    "/:id",
    authentication,
    validateData(updateVideoSchema, "body"),
    (req, res, next) => req.container.resolve("videoController").update(req, res, next)
);

/**
 * @swagger
 * /videos/{videoId}/replace:
 *   post:
 *     summary: Re-upload video file
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - mimeType
 *               - size
 *             properties:
 *               filename:
 *                 type: string
 *                 example: "lesson-v2.mp4"
 *               mimeType:
 *                 type: string
 *                 example: "video/mp4"
 *               size:
 *                 type: number
 *                 example: 110000000
 *     responses:
 *       200:
 *         description: Presigned URL for re-upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Not the owner or admin/staff
 *       404:
 *         description: Video not found
 */
router.post(
    "/:videoId/replace",
    authentication,
    validateData(replaceVideoSchema, "body"),
    (req, res, next) => req.container.resolve("videoController").replaceVideo(req, res, next)
);

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video đã được xoá thành công."
 *       403:
 *         description: Not the owner or admin/staff
 *       404:
 *         description: Video not found
 *       409:
 *         description: Video is linked to a lesson
 */
router.delete(
    "/:id",
    authentication,
    (req, res, next) => req.container.resolve("videoController").delete(req, res, next)
);

export default router;