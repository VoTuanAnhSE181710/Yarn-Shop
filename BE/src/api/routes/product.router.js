import express from "express";
import {
  authentication,
  authorizationByRole,
  validateData,
} from "../middlewares/middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdParamSchema,
} from "../../validators/product.validator.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductVariant:
 *       type: object
 *       required:
 *         - color
 *         - hexCode
 *         - price
 *         - image
 *       properties:
 *         _idVariants:
 *           type: string
 *           description: Auto-generated variant id (placed first in response)
 *         image:
 *           type: string
 *         color:
 *           type: string
 *         hexCode:
 *           type: string
 *           description: Hex color code (e.g. #FF0000)
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [yarn, hook, kit, accessory, tool]
 *         image:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
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
 * /products:
 *   get:
 *     summary: Get products list
 *     description: |
 *       Get paginated list of products.
 *       - Public users: only `isActive = true` products are returned.
 *       - Admin users: can pass `includeInactive=true` to include inactive products.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [yarn, hook, kit, accessory, tool]
 *       - in: query
 *         name: tag
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
 *           enum: [newest, oldest, name_asc, name_desc]
 *           default: newest
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Admin only. Include inactive (soft-deleted) products.
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get(
  "/",
  validateData(productQuerySchema, "query"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.getAll(req, res, next);
  },
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a product with at least one variant. Admin only.
 *     tags: [Products]
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
 *               - description
 *               - category
 *               - image
 *               - variants
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [yarn, hook, kit, accessory, tool]
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               variants:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [color, hexCode, price, image]
 *                   properties:
 *                     color:
 *                       type: string
 *                     hexCode:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *                     image:
 *                       type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  authentication,
  authorizationByRole(["Admin"]),
  validateData(createProductSchema, "body"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.create(req, res, next);
  },
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: |
 *       Get a single product by its ID.
 *       - Public users: 404 if the product is `isActive = false`.
 *       - Admin users: can always get the product regardless of `isActive`.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  validateData(productIdParamSchema, "params"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.getById(req, res, next);
  },
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     description: Update any field of a product. At least one field must be provided. Admin only.
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [yarn, hook, kit, accessory, tool]
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:id",
  authentication,
  authorizationByRole(["Admin"]),
  validateData(productIdParamSchema, "params"),
  validateData(updateProductSchema, "body"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.update(req, res, next);
  },
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Restore a soft-deleted product
 *     description: Set product `isActive` back to true. Admin only.
 *     tags: [Products]
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
 *         description: Product restored successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
  "/:id/restore",
  authentication,
  authorizationByRole(["Admin"]),
  validateData(productIdParamSchema, "params"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.restore(req, res, next);
  },
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Soft delete product
 *     description: Set product `isActive` to false. Admin only.
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/:id",
  authentication,
  authorizationByRole(["Admin"]),
  validateData(productIdParamSchema, "params"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.delete(req, res, next);
  },
);

export default router;
