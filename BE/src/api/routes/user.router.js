import express from 'express';
import { authentication, checkPermission, validateData, verifyDevice } from '../middlewares/middleware.js';
import { updateUserSchema, updateStatusSchema, getAllUserSchema, changeRoleSchema, adminUpdateUserSchema } from '../../validators/user.validator.js';
import { uploadAvatar } from '../../utils/multerStorage.js';

const router = express.Router();

/**
 * @swagger
 * /users/{queryUserId}:
 *   patch:
 *     summary: Update user data (self only)
 *     description: Update user information such as email, fullName, phone, address, gender, and date of birth. Users can only update their own data. The queryUserId in the path must match the authenticated user's ID.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user to update (must match authenticated user's ID)
 *         example: '65be000000000000000001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDataRequest'
 *     responses:
 *       200:
 *         description: User data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUserDataResponse'
 *       400:
 *         description: Bad request - Invalid data, duplicate email/phone, or attempting to update another user's data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notOwnUser:
 *                 summary: Attempting to update another user
 *                 value:
 *                   status: error
 *                   message: You can only update your data
 *               duplicateData:
 *                 summary: Duplicate email or phone
 *                 value:
 *                   status: error
 *                   message: this email or phone cant be duplicate
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    "/:queryUserId",
    validateData(updateUserSchema, "body"),
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const userController = req.container.resolve("userController");

        await userController.update(req, res ,next);
    }
)

/**
 * @swagger
 * /users/upload-avatar/{queryUserId}:
 *   patch:
 *     summary: Upload/replace user avatar (self only)
 *     description: |
 *       Upload or replace the authenticated user's avatar image to Cloudinary.
 *       The queryUserId in the path must match the authenticated user's ID.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user (must match authenticated user's ID)
 *         example: '65be000000000000000001'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (jpg/png)
 *     responses:
 *       200:
 *         description: Avatar updated successfully
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
 *                     updatedUser:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '65be000000000000000001'
 *                         avatar:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               example: 'https://res.cloudinary.com/.../image/upload/v123/user_avatars/avatar.jpg'
 *                             publicId:
 *                               type: string
 *                               example: 'user_avatars/abc123'
 *       400:
 *         description: Bad request - Missing file, invalid userId, or attempting to update another user's avatar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFile:
 *                 summary: Missing avatar file
 *                 value:
 *                   status: error
 *                   message: Avatar file is required
 *               notOwnUser:
 *                 summary: Attempting to update another user
 *                 value:
 *                   status: error
 *                   message: You can only update your data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.patch(
    "/upload-avatar/:queryUserId",
    authentication,
    verifyDevice,
    uploadAvatar.single('avatar'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");

        await userController.updateUserAvatar(req, res ,next);
    }
)

/**
 * @swagger
 * /users/admin-update/{queryUserId}:
 *   patch:
 *     summary: Admin/Staff update user data
 *     description: |
 *       Admin or Staff can update any user's data except role and status (those have dedicated endpoints).
 *       Updatable fields: username, email, fullName, phone, address, gender, dateOfBirth, subscription.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user to update
 *         example: '65be000000000000000001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userData
 *             properties:
 *               userData:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: 'john_doe'
 *                   email:
 *                     type: string
 *                     example: 'john@example.com'
 *                   fullName:
 *                     type: string
 *                     example: 'John Doe'
 *                   phone:
 *                     type: string
 *                     example: '0123456789'
 *                   address:
 *                     type: string
 *                     example: '123 Main St'
 *                   gender:
 *                     type: string
 *                     enum: [MALE, FEMALE]
 *                   dateOfBirth:
 *                     type: string
 *                     example: '01/15/1990'
 *                   subscription:
 *                     type: string
 *                     enum: [Freemium, Premium]
 *     responses:
 *       200:
 *         description: User data updated successfully
 *       400:
 *         description: Bad request - Invalid data or duplicate email/phone/username
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only Admin or Staff can update users
 *       404:
 *         description: User not found
 */
router.patch(
    "/admin-update/:queryUserId",
    validateData(adminUpdateUserSchema, "body"),
    authentication,
    verifyDevice,
    checkPermission('User', 'manage'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");
        await userController.adminUpdate(req, res, next);
    }
)

/**
 * @swagger
 * /users/update-status/{queryUserId}:
 *   patch:
 *     summary: Update user status (Admin only)
 *     description: Update user account status (ACTIVE, INACTIVE, or LOCKED). Only Admin role can perform this action. Can update any user's status.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user to update status
 *         example: '65be000000000000000001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserStatusRequest'
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUserStatusResponse'
 *       400:
 *         description: Bad request - Invalid status value
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
 *         description: Forbidden - Only Admin can update user status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    "/update-status/:queryUserId",
    validateData(updateStatusSchema, "body"),
    authentication,
    verifyDevice,
    checkPermission('User', 'manage'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");

        await userController.updateStatus(req, res, next);
    }
)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination and filters
 *     description: Retrieve a paginated list of all users with optional filters. Only Admin can access this endpoint.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 10
 *           maximum: 20
 *           default: 10
 *         description: Number of users per page (10-20)
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, LOCKED]
 *         description: Filter by user status
 *         example: ACTIVE
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *         description: Filter by role MongoDB ObjectId
 *         example: '65be000000000000000010'
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     result:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               userId:
 *                                 type: string
 *                                 example: '65be000000000000000001'
 *                               username:
 *                                 type: string
 *                                 example: johndoe
 *                               email:
 *                                 type: string
 *                                 example: john.doe@example.com
 *                               fullName:
 *                                 type: string
 *                                 example: John Doe
 *                               phone:
 *                                 type: string
 *                                 example: '0123456789'
 *                               status:
 *                                 type: string
 *                                 enum: [ACTIVE, INACTIVE, LOCKED]
 *                                 example: ACTIVE
 *                               roleId:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                     example: '65be000000000000000010'
 *                                   roleName:
 *                                     type: string
 *                                     example: Admin
 *                         totalUsers:
 *                           type: integer
 *                           example: 50
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *       400:
 *         description: Bad request - Invalid query parameters
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
 *         description: Forbidden - Only Admin can access user list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/",
    validateData(getAllUserSchema, "query"),
    authentication,
    verifyDevice,
    checkPermission('User', 'manage'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController")

        await userController.getAllUsers(req, res, next);
    }
)

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile information of the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     userProfile:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '65be000000000000000001'
 *                         username:
 *                           type: string
 *                           example: johndoe
 *                         email:
 *                           type: string
 *                           example: john.doe@example.com
 *                         phone:
 *                           type: string
 *                           example: '0123456789'
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *                         gender:
 *                           type: string
 *                           enum: [MALE, FEMALE]
 *                           example: MALE
 *                         dateOfBirth:
 *                           type: string
 *                           format: date
 *                           example: '1990-01-01'
 *                         address:
 *                           type: string
 *                           example: 123 Main Street, City
 *                         status:
 *                           type: string
 *                           enum: [ACTIVE, INACTIVE, LOCKED]
 *                           example: ACTIVE
 *                         roleId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: '65be000000000000000010'
 *                             roleName:
 *                               type: string
 *                               example: Admin
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/me",
    authentication,
    verifyDevice,
    async (req, res, next) => {
        const userController = req.container.resolve("userController");
        await userController.getMyProfile(req, res, next);
    }
)

/**
 * @swagger
 * /users/statistics:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     description: Get statistics about users including totals, active/inactive counts, and role distribution
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get("/statistics",
    authentication,
    verifyDevice,
    checkPermission('User', 'read'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");
        await userController.getStatistics(req, res, next);
    }
)

/**
 * @swagger
 * /users/{queryUserId}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     description: Retrieve detailed information of a specific user by their MongoDB ObjectId. Only Admin can access this endpoint.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user
 *         example: '65be000000000000000001'
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                     result:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '65be000000000000000001'
 *                         username:
 *                           type: string
 *                           example: johndoe
 *                         email:
 *                           type: string
 *                           example: john.doe@example.com
 *                         phone:
 *                           type: string
 *                           example: '0123456789'
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *                         gender:
 *                           type: string
 *                           enum: [MALE, FEMALE]
 *                           example: MALE
 *                         dateOfBirth:
 *                           type: string
 *                           format: date
 *                           example: '1990-01-01'
 *                         address:
 *                           type: string
 *                           example: 123 Main Street, City
 *                         status:
 *                           type: string
 *                           enum: [ACTIVE, INACTIVE, LOCKED]
 *                           example: ACTIVE
 *                         roleId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: '65be000000000000000010'
 *                             roleName:
 *                               type: string
 *                               example: Admin
 *       400:
 *         description: Bad request - Invalid user ID format
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
 *         description: Forbidden - Only Admin can access user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/:queryUserId",
    authentication,
    verifyDevice,
    checkPermission('User', 'read'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");

        await userController.getUserById(req, res, next);
    }
)

/**
 * @swagger
 * /users/{queryUserId}:
 *   delete:
 *     summary: Soft delete a user (Admin only)
 *     description: Soft delete a user by setting their status to INACTIVE. Only Admin can perform this action. Admin cannot delete their own account. The deletion is logged with timestamp, admin ID, and reason.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user to delete (cannot be your own ID)
 *         example: '65be000000000000000001'
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedUser:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '65be000000000000000001'
 *                         username:
 *                           type: string
 *                           example: johndoe
 *                         email:
 *                           type: string
 *                           example: john.doe@example.com
 *                         status:
 *                           type: string
 *                           example: INACTIVE
 *       400:
 *         description: Bad request - User does not exist, already deleted/disabled, or attempting to delete own account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: User does not exist!
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   status: error
 *                   message: User does not exist!
 *               deletingOwnAccount:
 *                 summary: Cannot delete own account
 *                 value:
 *                   status: error
 *                   message: Cannot delete your own account
 *               alreadyInactive:
 *                 summary: User already deleted
 *                 value:
 *                   status: error
 *                   message: User is already deleted or disabled!
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only Admin can delete users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /users/{queryUserId}/role:
 *   patch:
 *     summary: Change user role (Admin only)
 *     description: Change the role of a user. Only Admin can change user roles. Admin cannot change their own role.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ObjectId of the user whose role will be changed
 *         example: '65be000000000000000001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: MongoDB ObjectId of the new role
 *                 example: '65be000000000000000002'
 *     responses:
 *       200:
 *         description: User role changed successfully
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
 *                   example: User role changed successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only Admin can change user roles
 *       404:
 *         description: User or Role not found
 */
router.patch(
    "/:queryUserId/role",
    validateData(changeRoleSchema, "body"),
    authentication,
    verifyDevice,
    checkPermission('User', 'manage'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");
        await userController.changeRole(req, res, next);
    }
)

router.delete(
    "/:queryUserId",
    authentication,
    verifyDevice,
    checkPermission('User', 'delete'),
    async (req, res, next) => {
        const userController = req.container.resolve("userController");
        await userController.softDelete(req, res, next);
    }
)

export default router;