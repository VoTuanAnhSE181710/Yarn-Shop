import express from "express";
import { authentication, checkPermission, validateData, verifyDevice } from "../middlewares/middleware.js";
import { createRoleSchema, getAllRolesValidator, updateRoleSchema } from "../../validators/role.validator.js";

const router = express.Router();

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
 *     description: Create a new role with specified permissions. Only Admin can create roles.
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Project Manager
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['65be000000000000000001', '65be000000000000000002']
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Can manage projects and tasks
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *                     role:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Role created successfully.
 *                         data:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: 65be000000000000000001
 *                             roleName:
 *                               type: string
 *                               example: Project Manager
 *                             permission:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             description:
 *                               type: string
 *                               example: Can manage projects and tasks
 *                             isActive:
 *                               type: boolean
 *                               example: true
 *       400:
 *         description: Bad request - Invalid input or role already exists
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
 *         description: Forbidden - Only Admin can create roles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/",
    authentication,
    verifyDevice,
    checkPermission('Role', 'create'),
    validateData(createRoleSchema),
    async (req, res, next) => {
        const roleController = req.container.resolve("roleController");
        await roleController.createRole(req, res, next);
    }
)

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles
 *     description: Retrieve a paginated list of roles with optional filters. Only Admin can view roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by role name (case-insensitive partial match)
 *         example: Manager
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                     message:
 *                       type: string
 *                       example: Roles retrieved successfully.
 *                     data:
 *                       type: object
 *                       properties:
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               roleName:
 *                                 type: string
 *                               permission:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                               description:
 *                                 type: string
 *                               isActive:
 *                                 type: boolean
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can view roles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/",
    authentication,
    verifyDevice,
    checkPermission('Role', 'read'),
    validateData(getAllRolesValidator, "query"),
    async (req, res, next) => {
        const roleController = req.container.resolve("roleController");
        await roleController.getAllRoles(req, res, next);
    }
)

/**
 * @swagger
 * /roles/statistics:
 *   get:
 *     tags: [Roles]
 *     summary: Get role statistics
 *     description: Get statistics about roles including totals and permission distribution
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Role statistics retrieved successfully.
 *                 data:
 *                   type: object
 */
router.get("/statistics",
    authentication,
    verifyDevice,
    checkPermission('Role', 'read'),
    async (req, res, next) => {
        const roleController = req.container.resolve("roleController");
        await roleController.getStatistics(req, res, next);
    }
)

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     description: Retrieve detailed information about a specific role including its permissions. Only Admin can view role details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *         example: 65be000000000000000001
 *     responses:
 *       200:
 *         description: Role retrieved successfully
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
 *                     role:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Role retrieved successfully.
 *                         data:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             roleName:
 *                               type: string
 *                             permission:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             description:
 *                               type: string
 *                             isActive:
 *                               type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can view roles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:roleId",
    authentication,
    verifyDevice,
    checkPermission('Role', 'read'),
    async (req, res, next) => {
        const roleController = req.container.resolve("roleController");
        await roleController.getRoleById(req, res, next);
    }
)

/**
 * @swagger
 * /roles/{roleId}:
 *   patch:
 *     tags: [Roles]
 *     summary: Update a role
 *     description: Update role details including permissions. Only Admin can update roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *         example: 65be000000000000000001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senior Project Manager
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['65be000000000000000001']
 *               description:
 *                 type: string
 *                 example: Updated description
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Role updated successfully
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
 *                     role:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Role updated successfully.
 *                         data:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             roleName:
 *                               type: string
 *                             permission:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             description:
 *                               type: string
 *                             isActive:
 *                               type: boolean
 *       400:
 *         description: Bad request - Invalid input
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
 *         description: Forbidden - Only Admin can update roles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:roleId",
    authentication,
    verifyDevice,
    checkPermission('Role', 'update'),
    validateData(updateRoleSchema),
    async (req, res, next) => {
        const roleController = req.container.resolve("roleController");
        await roleController.updateRole(req, res, next);
    }
)

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role
 *     description: Soft delete a role (set isActive to false). Cannot delete roles that are assigned to users. Only Admin can delete roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *         example: 65be000000000000000001
 *     responses:
 *       200:
 *         description: Role deleted successfully
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
 *                     role:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Role deleted successfully.
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can delete roles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Role is assigned to users and cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:roleId",
    authentication,
    verifyDevice,
    checkPermission('Role', 'delete'),
    async (req, res, next) => {
        const roleController = req.container.resolve("roleController");
        await roleController.deleteRole(req, res, next);
    }
)

export default router;