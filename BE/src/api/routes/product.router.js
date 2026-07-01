import express from "express";
import {
  authentication,
  checkPermission,
  validateData,
} from "../middlewares/middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdParamSchema,
} from "../../validators/product.validator.js";
import { uploadProduct } from "../../utils/multerStorage.js";

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
 *         size:
 *           type: string
 *           description: 'Optional size label (e.g. "100g" for yarn, "3mm" for hooks/needles)'
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
 *           enum: [yarn, hook, needle, kit, accessory]
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
 *           enum: [yarn, hook, needle, kit, accessory]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - image
 *             properties:
 *               data:
 *                 type: object
 *                 description: 'JSON object containing product details'
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                     enum: [yarn, hook, needle, kit, accessory]
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   variants:
 *                     type: array
 *                     minItems: 1
 *                     items:
 *                       type: object
 *                       required: [color, hexCode, price]
 *                       properties:
 *                         color:
 *                           type: string
 *                         hexCode:
 *                           type: string
 *                         price:
 *                           type: number
 *                         stock:
 *                           type: number
 *                   isActive:
 *                     type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Main product image
 *               variantImage_0:
 *                 type: string
 *                 format: binary
 *                 description: 'Image file for variant at index 0 (Optional)'
 *               variantImage_1:
 *                 type: string
 *                 format: binary
 *                 description: 'Image file for variant at index 1 (Optional)'
 *               variantImage_2:
 *                 type: string
 *                 format: binary
 *                 description: 'Image file for variant at index 2 (Optional)'
 *               variantImage_3:
 *                 type: string
 *                 format: binary
 *                 description: 'Image file for variant at index 3 (Optional)'
 *               variantImage_4:
 *                 type: string
 *                 format: binary
 *                 description: 'Image file for variant at index 4 (Optional)'
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
  checkPermission('Product', 'create'),
  uploadProduct.any(),
  (req, res, next) => {
    try {
      if (!req.body.data) {
        throw new Error("Missing 'data' field containing product JSON.");
      }

      // Parse the JSON string from the 'data' field
      let productData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;

      if (req.files) {
        const mainImageFile = req.files.find(f => f.fieldname === 'image');
        if (mainImageFile) productData.image = mainImageFile.path;
      }

      if (Array.isArray(productData.variants) && req.files) {
        productData.variants.forEach((variant, index) => {
          const variantImageFile = req.files.find(f => f.fieldname === `variantImage_${index}`);
          if (variantImageFile) {
            variant.image = variantImageFile.path;
          }
        });
      }
      
      // Replace req.body with the fully parsed productData so Joi validation works
      req.body = productData;
      
      next();
    } catch (error) {
      return res.status(400).json({ status: "error", message: "Invalid form data format. Make sure 'data' is valid JSON.", error: error.message });
    }
  },
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
 *                 enum: [yarn, hook, needle, kit, accessory]
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
  checkPermission('Product', 'update'),
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
  "/:id",
  authentication,
  checkPermission('Product', 'update'),
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
  checkPermission('Product', 'delete'),
  validateData(productIdParamSchema, "params"),
  async (req, res, next) => {
    const productController = req.container.resolve("productController");
    await productController.delete(req, res, next);
  },
);

export default router;
