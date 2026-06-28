import express from 'express';
import { authentication, validateData } from '../middlewares/middleware.js';
import { createCourseSchema, updateCourseSchema, courseQuerySchema } from '../../validators/course.validator.js';
import { createLessonSchema, updateLessonSchema } from '../../validators/lesson.validator.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         thumbnail:
 *           type: string
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         creatorId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *             fullName:
 *               type: string
 *             avatar:
 *               type: object
 *         totalDuration:
 *           type: number
 *         totalLessons:
 *           type: number
 *         rating:
 *           type: number
 *         enrolledCount:
 *           type: number
 *         linkedComboIds:
 *           type: array
 *           items:
 *             type: string
 *         isPublished:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Lesson:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         courseId:
 *           type: string
 *         title:
 *           type: string
 *         order:
 *           type: number
 *         videoUrl:
 *           type: string
 *         duration:
 *           type: number
 *         linkedProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               timestamp:
 *                 type: number
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               thumbnail:
 *                 type: string
 *         linkedCombos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               comboId:
 *                 type: string
 *               timestamp:
 *                 type: number
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               thumbnail:
 *                 type: string
 *         isPreview:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/* ============================================================
 * PUBLIC COURSE & LESSON ENDPOINTS
 * ============================================================ */

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get courses list
 *     description: Get paginated list of published courses. Public access.
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by course level
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *         description: Filter by creator ObjectId
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
 *           enum: [newest, oldest, rating, enrolled]
 *           default: newest
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get("/courses", validateData(courseQuerySchema, "query"), async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.getAll(req, res, next);
});

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     description: Get detailed course information with lessons list.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get("/courses/:id", async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.getById(req, res, next);
});

/**
 * @swagger
 * /courses/{courseId}/lessons:
 *   get:
 *     summary: Get all lessons of a course
 *     description: Get all lessons of a course sorted by order.
 *     tags: [Courses & Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Lessons retrieved successfully
 */
router.get("/courses/:courseId/lessons", async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.getByCourseId(req, res, next);
});

/**
 * @swagger
 * /courses/{courseId}/lessons/{lessonId}:
 *   get:
 *     summary: Get lesson detail
 *     description: |
 *       Get detailed information of a specific lesson.
 *       Authentication is required if the lesson is not marked as preview.
 *     tags: [Courses & Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Lesson retrieved successfully
 *       401:
 *         description: Authentication required for non-preview lessons
 */
router.get("/courses/:courseId/lessons/:lessonId", async (req, res, next) => {
    // Optional authentication — try to parse token if available
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const tokenService = req.container.resolve("tokenService");
            const accessToken = authHeader.split(" ")[1];
            if (accessToken) {
                const decode = tokenService.verifyAccessToken({ token: accessToken });
                if (decode) req.user = decode;
            }
        } catch (e) { /* ignore */ }
    }

    const lessonController = req.container.resolve("lessonController");
    await lessonController.getById(req, res, next);
});

/* ============================================================
 * ADMIN COURSE & LESSON ENDPOINTS
 * ============================================================ */

/**
 * @swagger
 * /admin/courses:
 *   post:
 *     summary: Create a new course
 *     description: Create a new course. Admin/Instructor only.
 *     tags: [Courses]
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
 *               - level
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedComboIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/admin/courses", authentication, validateData(createCourseSchema, "body"), async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.create(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{id}:
 *   put:
 *     summary: Update a course / publish
 *     description: Update course information or publish it. Admin/Instructor only.
 *     tags: [Courses]
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
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedComboIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.put("/admin/courses/:id", authentication, validateData(updateCourseSchema, "body"), async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.update(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{id}:
 *   delete:
 *     summary: Delete / hide a course
 *     description: Soft delete a course. Admin/Instructor only.
 *     tags: [Courses]
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
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.delete("/admin/courses/:id", authentication, async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.delete(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{courseId}/lessons:
 *   post:
 *     summary: Add a new lesson to a course
 *     description: Create a new lesson within a course. Admin/Instructor only.
 *     tags: [Courses & Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - order
 *               - videoUrl
 *             properties:
 *               title:
 *                 type: string
 *               order:
 *                 type: integer
 *               videoUrl:
 *                 type: string
 *               duration:
 *                 type: number
 *               linkedProducts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     timestamp:
 *                       type: number
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     thumbnail:
 *                       type: string
 *               linkedCombos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     comboId:
 *                       type: string
 *                     timestamp:
 *                       type: number
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     thumbnail:
 *                       type: string
 *               isPreview:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/admin/courses/:courseId/lessons", authentication, validateData(createLessonSchema, "body"), async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.create(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{courseId}/lessons/{lessonId}:
 *   put:
 *     summary: Update a lesson
 *     description: Update lesson details (video, linkedProducts, linkedCombos, order). Admin/Instructor only.
 *     tags: [Courses & Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               order:
 *                 type: integer
 *               videoUrl:
 *                 type: string
 *               duration:
 *                 type: number
 *               linkedProducts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     timestamp:
 *                       type: number
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     thumbnail:
 *                       type: string
 *               linkedCombos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     comboId:
 *                       type: string
 *                     timestamp:
 *                       type: number
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     thumbnail:
 *                       type: string
 *               isPreview:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lesson not found
 */
router.put("/admin/courses/:courseId/lessons/:lessonId", authentication, validateData(updateLessonSchema, "body"), async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.update(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{courseId}/lessons/{lessonId}:
 *   delete:
 *     summary: Delete a lesson
 *     description: Delete a lesson from a course. Admin/Instructor only.
 *     tags: [Courses & Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lesson not found
 */
router.delete("/admin/courses/:courseId/lessons/:lessonId", authentication, async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.delete(req, res, next);
});

export default router;