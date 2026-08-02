import express from "express";
import { authentication } from "../middlewares/middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Sync and manage user's shopping cart across devices
 *
 * components:
 *   schemas:
 *     CartItemInput:
 *       type: object
 *       required: [productId, variantId, quantity]
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product
 *         variantId:
 *           type: string
 *           description: ID of the product variant
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the item
 *     CartItemResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         productId:
 *           type: string
 *         variantId:
 *           type: string
 *         quantity:
 *           type: integer
 *         product:
 *           type: object
 *           properties:
 *             id: { type: string }
 *             name: { type: string }
 *             image: { type: string }
 *             category: { type: string }
 *         variant:
 *           type: object
 *           properties:
 *             id: { type: string }
 *             color: { type: string }
 *             size: { type: string }
 *             price: { type: number }
 *             stock: { type: number }
 *             image: { type: string }
 *         itemTotal:
 *           type: number
 *     CartResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItemResponse'
 *         cartTotal:
 *           type: number
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user's cart
 *     description: Retrieve the user's cart populated with product and variant details. Validates stock limits.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved cart
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
 *                     cart:
 *                       $ref: '#/components/schemas/CartResponse'
 *       401:
 *         description: Unauthorized
 */
router.get("/", authentication, async (req, res, next) => {
  const controller = req.container.resolve("cartController");
  await controller.getCart(req, res, next);
});

/**
 * @swagger
 * /cart/sync:
 *   post:
 *     summary: Sync/override cart items
 *     description: Sync the user's backend cart with the local storage array. Replaces the backend cart items with the provided array.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItemInput'
 *     responses:
 *       200:
 *         description: Successfully synced cart
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
 *                     cart:
 *                       $ref: '#/components/schemas/CartResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/sync", authentication, async (req, res, next) => {
  const controller = req.container.resolve("cartController");
  await controller.syncCart(req, res, next);
});

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Clear user's cart
 *     description: Empties the user's cart.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully cleared cart
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
 *                     cart:
 *                       $ref: '#/components/schemas/CartResponse'
 *       401:
 *         description: Unauthorized
 */
router.delete("/", authentication, async (req, res, next) => {
  const controller = req.container.resolve("cartController");
  await controller.clearCart(req, res, next);
});

export default router;
