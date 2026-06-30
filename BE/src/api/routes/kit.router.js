import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';

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
 *     description: Retrieve a list of all active kits. Public access.
 *     tags: [Kits]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by kit level (beginner, intermediate, advanced)
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
 * /kits:
 *   post:
 *     summary: Create a kit (Staff/Admin)
 *     description: Create a new kit. Requires authentication and Kit manage permission.
 *     tags: [Kits]
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               price:
 *                 type: number
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Kit created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    authentication,
    checkPermission('Kit', 'create'),
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.createKit(req, res, next);
    }
);

/**
 * @swagger
 * /kits/{id}:
 *   get:
 *     summary: Get a kit by ID
 *     description: Retrieve detailed information about a specific kit. Public access.
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

/**
 * @swagger
 * /kits/{id}:
 *   put:
 *     summary: Update a kit (Staff/Admin)
 *     description: Update an existing kit by ID. Requires authentication and Kit manage permission.
 *     tags: [Kits]
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
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               price:
 *                 type: number
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kit updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Kit not found
 */
router.put(
    "/:id",
    authentication,
    checkPermission('Kit', 'update'),
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.updateKit(req, res, next);
    }
);

/**
 * @swagger
 * /kits/{id}:
 *   delete:
 *     summary: Soft delete a kit (Staff/Admin)
 *     description: Set a kit's isActive to false. Requires authentication and Kit manage permission.
 *     tags: [Kits]
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
 *         description: Kit deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Kit not found
 */
router.delete(
    "/:id",
    authentication,
    checkPermission('Kit', 'delete'),
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.deleteKit(req, res, next);
    }
);

export default router;