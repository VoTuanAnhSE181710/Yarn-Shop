import express from 'express';
import { authentication, validateData } from '../middlewares/middleware.js';
import { createCourseSchema, updateCourseSchema } from '../../validators/course.validator.js';
import { createLessonSchema, updateLessonSchema } from '../../validators/lesson.validator.js';

const router = express.Router();

/**
 * @swagger
 * /admin/courses:
 *   post:
 *     summary: Create a new course
 *     description: Create a new course. Admin/Instructor only.
 *     tags: [Courses & Lessons Admin]
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
router.post("/", authentication, validateData(createCourseSchema, "body"), async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.create(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{id}:
 *   put:
 *     summary: Update a course / publish
 *     description: Update course information or publish it. Admin/Instructor only.
 *     tags: [Courses & Lessons Admin]
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
router.put("/:id", authentication, validateData(updateCourseSchema, "body"), async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.update(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{id}:
 *   delete:
 *     summary: Delete / hide a course
 *     description: Soft delete a course. Admin/Instructor only.
 *     tags: [Courses & Lessons Admin]
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
router.delete("/:id", authentication, async (req, res, next) => {
    const courseController = req.container.resolve("courseController");
    await courseController.delete(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{courseId}/lessons:
 *   post:
 *     summary: Add a new lesson to a course
 *     description: Create a new lesson within a course. Admin/Instructor only.
 *     tags: [Courses & Lessons Admin]
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
router.post("/:courseId/lessons", authentication, validateData(createLessonSchema, "body"), async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.create(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{courseId}/lessons/{lessonId}:
 *   put:
 *     summary: Update a lesson
 *     description: Update lesson details (video, linkedProducts, linkedCombos, order). Admin/Instructor only.
 *     tags: [Courses & Lessons Admin]
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
router.put("/:courseId/lessons/:lessonId", authentication, validateData(updateLessonSchema, "body"), async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.update(req, res, next);
});

/**
 * @swagger
 * /admin/courses/{courseId}/lessons/{lessonId}:
 *   delete:
 *     summary: Delete a lesson
 *     description: Delete a lesson from a course. Admin/Instructor only.
 *     tags: [Courses & Lessons Admin]
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
router.delete("/:courseId/lessons/:lessonId", authentication, async (req, res, next) => {
    const lessonController = req.container.resolve("lessonController");
    await lessonController.delete(req, res, next);
});

export default router;
