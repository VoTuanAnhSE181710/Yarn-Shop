import express from 'express';
import { authentication, validateData } from '../middlewares/middleware.js';
import { createCourseSchema, updateCourseSchema, courseQuerySchema, rateCourseSchema } from '../../validators/course.validator.js';
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
 *           enum: [beginner, mid, pro]
 *         linkedLessons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Lesson'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         linkedCombo:
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
 *         title:
 *           type: string
 *         order:
 *           type: number
 *         videoUrl:
 *           type: string
 *         duration:
 *           type: number
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
 * PUBLIC COURSE ENDPOINTS
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
 *           enum: [beginner, mid, pro]
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
 *     description: Get detailed course information with linked lessons populated.
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
 * /courses/{id}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     description: Increment the enrollment count of a course. Authenticated access.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Enrolled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/courses/:id/enroll", authentication, async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.enroll(req, res, next);
});

/**
 * @swagger
 * /courses/{id}/rate:
 *   post:
 *     summary: Rate a course
 *     description: Submit/update a course rating. Authenticated access.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value between 1 and 5
 *     responses:
 *       200:
 *         description: Rated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/courses/:id/rate", authentication, validateData(rateCourseSchema, "body"), async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.rate(req, res, next);
});

/* ============================================================
 * PUBLIC LESSON ENDPOINTS
 * ============================================================ */

/**
 * @swagger
 * /lessons/{lessonId}:
 *   get:
 *     summary: Get lesson detail
 *     description: |
 *       Get detailed information of a specific lesson.
 *       Authentication is required if the lesson is not marked as preview.
 *     tags: [Lessons]
 *     parameters:
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
router.get("/lessons/:lessonId", async (req, res, next) => {
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
 * ADMIN COURSE ENDPOINTS
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
 *                 enum: [beginner, mid, pro]
 *               linkedLessons:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedCombo:
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
 *                 enum: [beginner, mid, pro]
 *               linkedLessons:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedCombo:
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
 * /admin/courses/{id}/lessons/{lessonId}:
 *   post:
 *     summary: Link a lesson to a course
 *     description: Add an existing lesson ID to a course's linkedLessons array. Admin/Instructor only.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: string
 *         required: true
 *         description: Lesson ID to link
 *     responses:
 *       200:
 *         description: Lesson linked to course successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/admin/courses/:id/lessons/:lessonId", authentication, async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.addLesson(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{id}/lessons/{lessonId}:
 *   delete:
 *     summary: Unlink a lesson from a course
 *     description: Remove a lesson ID from a course's linkedLessons array. Admin/Instructor only.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: string
 *         required: true
 *         description: Lesson ID to unlink
 *     responses:
 *       200:
 *         description: Lesson unlinked from course successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.delete("/admin/courses/:id/lessons/:lessonId", authentication, async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.removeLesson(req, res, next);
});

/* ============================================================
 * ADMIN LESSON ENDPOINTS
 * ============================================================ */

/**
 * @swagger
 * /admin/lessons:
 *   get:
 *     summary: Get all lessons
 *     description: Get all lessons (standalone, not nested under course). Admin/Instructor only.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lessons retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/admin/lessons", authentication, async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.getAll(req, res, next);
});

/**
 * @swagger
 * /admin/lessons:
 *   post:
 *     summary: Create a new standalone lesson
 *     description: Create a new lesson. Attach it to a course separately via the link endpoint. Admin/Instructor only.
 *     tags: [Lessons]
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
 *               linkedProduct:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *               linkedCombo:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     comboId:
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
 */
router.post("/admin/lessons", authentication, validateData(createLessonSchema, "body"), async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.create(req, res, next);
});

/**
 * @swagger
 * /admin/lessons/{lessonId}:
 *   put:
 *     summary: Update a lesson
 *     description: Update lesson details. Admin/Instructor only.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *               linkedProduct:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *               linkedCombo:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     comboId:
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
router.put("/admin/lessons/:lessonId", authentication, validateData(updateLessonSchema, "body"), async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.update(req, res, next);
});

/**
 * @swagger
 * /admin/lessons/{lessonId}:
 *   delete:
 *     summary: Delete a lesson
 *     description: Delete a standalone lesson. Admin/Instructor only.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
router.delete("/admin/lessons/:lessonId", authentication, async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.delete(req, res, next);
});

export default router;