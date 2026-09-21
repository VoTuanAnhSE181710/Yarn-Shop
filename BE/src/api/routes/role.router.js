import express from 'express';
import Role from '../../models/role.js';
import { authentication } from '../middlewares/middleware.js';

const router = express.Router();

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles (for Dropdown)
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get("/", authentication, async (req, res, next) => {
    try {
        const roles = await Role.find({}, '_id roleName');
        return res.status(200).json({
            status: 'success',
            data: roles
        });
    } catch (error) {
        next(error);
    }
});

export default router;
