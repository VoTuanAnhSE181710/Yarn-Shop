import express from 'express';
// import { authentication } from '../middlewares/middleware.js'; // Uncomment if authentication is required for viewing

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Kit:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         thumbnail:
 *           type: string
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         price:
 *           type: number
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *         linkedCourseIds:
 *           type: array
 *           items:
 *             type: string
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
 * /kits:
 *   get:
 *     summary: Get all kits
 *     description: Retrieve a list of all active kits.
 *     tags: [Kits]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by kit level (beginner, intermediate, advanced)
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by linked course ID
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
 *         description: A list of kits
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
 *                     kits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Kit'
 */
router.get(
    "/",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.getAllKits(req, res, next);
    }
);

/**
 * @swagger
 * /kits/{id}:
 *   get:
 *     summary: Get a kit by ID
 *     description: Retrieve detailed information about a specific kit.
 *     tags: [Kits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The kit ID
 *     responses:
 *       200:
 *         description: Kit details
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
 *                     kit:
 *                       $ref: '#/components/schemas/Kit'
 *       404:
 *         description: Kit not found
 */
router.get(
    "/:id",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.getKitById(req, res, next);
    }
);

export default router;
