import express from 'express';
import { authentication, checkPermission } from '../middlewares/middleware.js';
import { uploadOrderReport } from '../../utils/multerStorage.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderReport:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         orderId:
 *           type: string
 *         reporterId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [PENDING, DONE, CANCELLED]
 *         adminNote:
 *           type: string
 *         assignedStaff:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateOrderReportRequest:
 *       type: object
 *       required:
 *         - orderId
 *         - title
 *         - description
 *       properties:
 *         orderId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Upload image files from device
 */

/**
 * @swagger
 * /order-reports:
 *   post:
 *     summary: Create a new order report (Customer)
 *     description: Report an issue with an order. User must own the order.
 *     tags: [OrderReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - title
 *               - description
 *             properties:
 *               orderId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload image files from device
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not your order
 *       404:
 *         description: Order not found
 */
router.post(
    "/",
    authentication,
    uploadOrderReport.array('images', 5),
    (req, res, next) => {
        try {
            // Attach uploaded image paths from Cloudinary
            if (req.files && req.files.length > 0) {
                req.body.images = req.files.map(f => f.path);
            }
            next();
        } catch (error) {
            return res.status(400).json({
                status: "error",
                message: "Error processing uploaded images",
                error: error.message
            });
        }
    },
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.create(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/my:
 *   get:
 *     summary: Get my reports (Customer)
 *     description: Get all reports created by the current user.
 *     tags: [OrderReports]
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
 *         description: Reports retrieved successfully
 */
router.get(
    "/my",
    authentication,
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.getMyReports(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports:
 *   get:
 *     summary: Get all reports (Admin/Staff)
 *     description: Get paginated list of all reports with search and filter.
 *     tags: [OrderReports]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, DONE, CANCELLED]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, status]
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    authentication,
    checkPermission("OrderReport", "read"),
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.getAll(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     description: Get detailed information about a specific report.
 *     tags: [OrderReports]
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
 *         description: Report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.get(
    "/:id",
    authentication,
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.getById(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}:
 *   put:
 *     summary: Update report (Customer - only when PENDING)
 *     description: Update report details. Only the reporter can update, and only when status is PENDING.
 *     tags: [OrderReports]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Cannot update when not PENDING
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Report not found
 */
router.put(
    "/:id",
    authentication,
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.update(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}:
 *   delete:
 *     summary: Delete report (Customer - only when PENDING)
 *     description: Delete a report. Only the reporter can delete, and only when status is PENDING.
 *     tags: [OrderReports]
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
 *         description: Report deleted successfully
 *       400:
 *         description: Cannot delete when not PENDING
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Report not found
 */
router.delete(
    "/:id",
    authentication,
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.delete(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}/status:
 *   patch:
 *     summary: Update report status (Admin/Staff)
 *     description: Update the status of a report to DONE or CANCELLED.
 *     tags: [OrderReports]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DONE, CANCELLED]
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.patch(
    "/:id/status",
    authentication,
    checkPermission("OrderReport", "update"),
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.updateStatus(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}/assign:
 *   patch:
 *     summary: Assign staff to report (Admin)
 *     description: Assign a staff member to handle the report.
 *     tags: [OrderReports]
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
 *             required:
 *               - assignedStaff
 *             properties:
 *               assignedStaff:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.patch(
    "/:id/assign",
    authentication,
    checkPermission("OrderReport", "update"),
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.assignStaff(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}/note:
 *   patch:
 *     summary: Update admin note (Admin/Staff)
 *     description: Add or update the admin note on a report.
 *     tags: [OrderReports]
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
 *             required:
 *               - adminNote
 *             properties:
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.patch(
    "/:id/note",
    authentication,
    checkPermission("OrderReport", "update"),
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.updateAdminNote(req, res, next);
    }
);

/**
 * @swagger
 * /order-reports/{id}:
 *   delete:
 *     summary: Delete report (Admin)
 *     description: Admin can delete any report regardless of status.
 *     tags: [OrderReports]
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
 *         description: Report deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.delete(
    "/:id/admin",
    authentication,
    checkPermission("OrderReport", "delete"),
    async (req, res, next) => {
        const controller = req.container.resolve("orderReportController");
        await controller.adminDelete(req, res, next);
    }
);

export default router;