import express from 'express';
import { authentication } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         fullName:
 *           type: string
 *         phone:
 *           type: string
 *         detailAddress:
 *           type: string
 *         provinceId:
 *           type: number
 *         provinceName:
 *           type: string
 *         districtId:
 *           type: number
 *         districtName:
 *           type: string
 *         wardCode:
 *           type: string
 *         wardName:
 *           type: string
 *         isDefault:
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
 * /addresses:
 *   get:
 *     summary: Get all addresses of the logged in user
 *     description: Retrieve all addresses associated with the currently authenticated user.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of addresses
 */
router.get(
    "/",
    authentication,
    async (req, res, next) => {
        const addressController = req.container.resolve("addressController");
        await addressController.getMyAddresses(req, res, next);
    }
);

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     summary: Get an address by ID
 *     description: Retrieve detailed information about a specific address.
 *     tags: [Addresses]
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
 *         description: Address details
 */
router.get(
    "/:id",
    authentication,
    async (req, res, next) => {
        const addressController = req.container.resolve("addressController");
        await addressController.getAddressById(req, res, next);
    }
);

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a new address
 *     description: Create a new address for the currently authenticated user.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - detailAddress
 *               - provinceId
 *               - provinceName
 *               - districtId
 *               - districtName
 *               - wardCode
 *               - wardName
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               detailAddress:
 *                 type: string
 *               provinceId:
 *                 type: number
 *               provinceName:
 *                 type: string
 *               districtId:
 *                 type: number
 *               districtName:
 *                 type: string
 *               wardCode:
 *                 type: string
 *               wardName:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 */
router.post(
    "/",
    authentication,
    async (req, res, next) => {
        const addressController = req.container.resolve("addressController");
        await addressController.createAddress(req, res, next);
    }
);

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Update an address
 *     description: Update an existing address by ID.
 *     tags: [Addresses]
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
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               detailAddress:
 *                 type: string
 *               provinceId:
 *                 type: number
 *               provinceName:
 *                 type: string
 *               districtId:
 *                 type: number
 *               districtName:
 *                 type: string
 *               wardCode:
 *                 type: string
 *               wardName:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put(
    "/:id",
    authentication,
    async (req, res, next) => {
        const addressController = req.container.resolve("addressController");
        await addressController.updateAddress(req, res, next);
    }
);

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     description: Delete an address by ID.
 *     tags: [Addresses]
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
 *         description: Address deleted successfully
 */
router.delete(
    "/:id",
    authentication,
    async (req, res, next) => {
        const addressController = req.container.resolve("addressController");
        await addressController.deleteAddress(req, res, next);
    }
);

export default router;
