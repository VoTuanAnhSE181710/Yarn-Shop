import express from 'express';
import { authentication, checkPermission, validateData } from '../middlewares/middleware.js';
import { Category } from '../../models/Model.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Get list of active categories for video classification.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 */
router.get(
    "/",
    authentication,
    async (req, res, next) => {
        try {
            const categories = await Category.find({ isActive: true })
                .sort({ name: 1 })
                .lean();

            res.status(200).json({
                status: 'success',
                data: { categories },
            });
        } catch (error) {
            next(error);
        }
    }
)

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category (Admin only)
 *     tags: [Categories]
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
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    authentication,
    checkPermission('Category', 'create'),
    async (req, res, next) => {
        try {
            const { name, slug, description } = req.body;

            const category = await Category.create({
                name,
                slug,
                description: description || "",
            });

            res.status(201).json({
                status: 'success',
                data: { category },
            });
        } catch (error) {
            next(error);
        }
    }
)

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category (Admin only)
 *     tags: [Categories]
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
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.patch(
    "/:id",
    authentication,
    checkPermission('Category', 'update'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const category = await Category.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            if (!category) {
                const error = new Error("Category not found");
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({
                status: 'success',
                data: { category },
            });
        } catch (error) {
            next(error);
        }
    }
)

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete(
    "/:id",
    authentication,
    checkPermission('Category', 'delete'),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const category = await Category.findByIdAndUpdate(
                id,
                { $set: { isActive: false } },
                { new: true }
            );

            if (!category) {
                const error = new Error("Category not found");
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({
                status: 'success',
                data: { message: "Category deleted successfully" },
            });
        } catch (error) {
            next(error);
        }
    }
)

export default router;