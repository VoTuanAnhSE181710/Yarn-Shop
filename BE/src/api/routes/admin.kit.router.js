import express from 'express';
// import { authentication, checkPermission } from '../middlewares/middleware.js';

const router = express.Router();

// Apply authentication and permissions middlewares if necessary
// router.use(authentication);
// router.use(checkPermission('Kit', 'manage'));

/**
 * @swagger
 * /admin/kits:
 *   post:
 *     summary: Create a kit (Admin)
 *     description: Create a new kit.
 *     tags: [Kits]
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
 *               linkedCourseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Kit created successfully
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
 */
router.post(
    "/",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.createKit(req, res, next);
    }
);

/**
 * @swagger
 * /admin/kits/{id}:
 *   put:
 *     summary: Update a kit (Admin)
 *     description: Update an existing kit by ID.
 *     tags: [Kits]
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
 *               linkedCourseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kit updated successfully
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
router.put(
    "/:id",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.updateKit(req, res, next);
    }
);

/**
 * @swagger
 * /admin/kits/{id}:
 *   delete:
 *     summary: Soft delete a kit (Admin)
 *     description: Set a kit's isActive to false.
 *     tags: [Kits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kit deleted successfully
 *       404:
 *         description: Kit not found
 */
router.delete(
    "/:id",
    async (req, res, next) => {
        const kitController = req.container.resolve("kitController");
        await kitController.deleteKit(req, res, next);
    }
);

export default router;
