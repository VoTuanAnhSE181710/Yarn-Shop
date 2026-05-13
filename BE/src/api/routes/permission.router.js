import express from "express";
import { validateData, authentication, verifyDevice, checkPermission } from "../middlewares/middleware.js";
import { createPermissionSchema, updatePermissionSchema, getPermissionsSchema } from "../../validators/permission.validator.js";

const router = express.Router();

/**
 * @swagger
 * /permissions/resources:
 *   get:
 *     summary: Get available resources and actions
 *     description: Get a list of available resources (models) and actions that can be used when creating permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resources and actions retrieved successfully
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
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["User", "Warehouse", "Role", "Permission", "Equipment", "Instrument", "InventoryItem", "MaintenanceHistory", "Incident", "Log"]
 *                       description: List of available resource names
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["create", "read", "update", "delete", "manage"]
 *                       description: List of available actions
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/resources",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'read'),
    (req, res, next) => {
        req.container.resolve("permissionController").getAvailableResources(req, res, next);
    }
);

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a new permission
 *     description: Create a new permission with name, resource, action and description. Only Admin can perform this action.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionRequest'
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatePermissionResponse'
 *       400:
 *         description: Bad request - Permission already exists or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can create permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'create'),
    validateData(createPermissionSchema),
    async (req, res, next) => {
        const permissionController = req.container.resolve("permissionController");
        await permissionController.createPermission(req, res, next);
    }
)

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve all permissions with optional filtering and pagination
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by permission name (case-insensitive partial match)
 *         example: 'create'
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource (case-insensitive partial match)
 *         example: 'User'
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, manage]
 *         description: Filter by action
 *         example: 'read'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetPermissionsResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'read'),
    validateData(getPermissionsSchema, "query"),
    async (req, res, next) => {
        const permissionController = req.container.resolve("permissionController");
        await permissionController.getAllPermissions(req, res, next);
    }
)

/**
 * @swagger
 * /permissions/statistics:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permission statistics
 *     description: Get statistics about permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get("/statistics",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'read'),
    async (req, res, next) => {
        const permissionController = req.container.resolve("permissionController");
        await permissionController.getStatistics(req, res, next);
    }
)

/**
 * @swagger
 * /permissions/{permissionId}:
 *   get:
 *     summary: Get permission by ID
 *     description: Retrieve a specific permission by its ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the permission
 *         example: '65be000000000000000001'
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetPermissionResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:permissionId",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'read'),
    async (req, res, next) => {
        const permissionController = req.container.resolve("permissionController");
        await permissionController.getPermissionById(req, res, next);
    }
)

/**
 * @swagger
 * /permissions/{permissionId}:
 *   patch:
 *     summary: Update permission
 *     description: Update permission information. At least one field must be provided. Only Admin can perform this action.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the permission to update
 *         example: '65be000000000000000001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePermissionRequest'
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdatePermissionResponse'
 *       400:
 *         description: Bad request - Invalid data or duplicate permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can update permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:permissionId",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'update'),
    validateData(updatePermissionSchema),
    async (req, res, next) => {
        const permissionController = req.container.resolve("permissionController");
        await permissionController.updatePermission(req, res, next);
    }
)

/**
 * @swagger
 * /permissions/{permissionId}:
 *   delete:
 *     summary: Delete permission
 *     description: Delete a permission by ID. Only Admin can perform this action.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the permission to delete
 *         example: '65be000000000000000001'
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 message:
 *                   type: string
 *                   example: 'Permission deleted successfully'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can delete permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:permissionId",
    authentication,
    verifyDevice,
    checkPermission('Permission', 'delete'),
    async (req, res, next) => {
        const permissionController = req.container.resolve("permissionController");
        await permissionController.deletePermission(req, res, next);
    }
)

export default router;