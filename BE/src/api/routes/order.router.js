import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ObjectId
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         color:
 *           type: string
 *           description: Variant color name
 *         hexCode:
 *           type: string
 *           description: Variant hex color code
 *     ShippingAddress:
 *       type: object
 *       required:
 *         - fullName
 *         - phone
 *         - address
 *         - ward
 *         - district
 *         - city
 *       properties:
 *         fullName:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         ward:
 *           type: string
 *         district:
 *           type: string
 *         city:
 *           type: string
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *         - shippingAddress
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           type: string
 *           enum: [COD, VNPAY]
 *           default: VNPAY
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *         itemsPrice:
 *           type: number
 *         shippingFee:
 *           type: number
 *         totalPrice:
 *           type: number
 *         payment:
 *           type: object
 *           properties:
 *             method:
 *               type: string
 *             status:
 *               type: string
 *             transactionNo:
 *               type: string
 *             paidAt:
 *               type: string
 *               format: date-time
 *         orderStatus:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateOrderResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         order:
 *           $ref: '#/components/schemas/Order'
 *         payUrl:
 *           type: string
 *           nullable: true
 *           description: VNPay payment URL (null if COD)
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: |
 *       Create a new order with cart items. If payment method is VNPAY, returns a payment URL.
 *       Prices are calculated server-side from the database for security.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateOrderResponse'
 *       400:
 *         description: Invalid input or insufficient stock
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/",
    authentication,
    checkPermission("Order", "create"),
    async (req, res, next) => {
        const orderController = req.container.resolve("orderController");
        await orderController.create(req, res, next);
    }
);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Get my orders
 *     description: Get all orders for the current authenticated user.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/my",
    authentication,
    async (req, res, next) => {
        const orderController = req.container.resolve("orderController");
        await orderController.getMyOrders(req, res, next);
    }
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin/Staff)
 *     description: Get paginated list of all orders. Requires admin or staff permissions.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, SHIPPING, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    authentication,
    checkPermission("Order", "read"),
    async (req, res, next) => {
        const orderController = req.container.resolve("orderController");
        await orderController.getAll(req, res, next);
    }
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Get detailed information of a specific order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ObjectId
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get(
    "/:id",
    authentication,
    async (req, res, next) => {
        const orderController = req.container.resolve("orderController");
        await orderController.getById(req, res, next);
    }
);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin/Staff)
 *     description: Update the order workflow status. Admin and Staff can update any order status.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [CONFIRMED, PREPARING, SHIPPING, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
    "/:id/status",
    authentication,
    checkPermission("Order", "update"),
    async (req, res, next) => {
        const orderController = req.container.resolve("orderController");
        await orderController.updateStatus(req, res, next);
    }
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel order (Customer)
 *     description: Cancel your own pending order. Only works if order is still in PENDING status.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ObjectId
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelReason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel - order is not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to cancel this order
 *       404:
 *         description: Order not found
 */
router.post(
    "/:id/cancel",
    authentication,
    checkPermission("Order", "delete"),
    async (req, res, next) => {
        const orderController = req.container.resolve("orderController");
        await orderController.cancel(req, res, next);
    }
);

export default router;