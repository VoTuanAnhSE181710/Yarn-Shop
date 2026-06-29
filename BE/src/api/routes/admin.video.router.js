import { Router } from "express";
import { authentication, authorizationByRole, validateData } from "../middlewares/middleware.js";
import { adminVideosQuerySchema } from "../../validators/video.validator.js";

const router = Router();

/**
 * GET /api/v1/admin/videos
 * Get all videos (Admin/Staff only)
 * Auth: Admin, Staff
 */
router.get(
    "/",
    authentication,
    authorizationByRole(["admin", "staff"]),
    validateData(adminVideosQuerySchema, "query"),
    (req, res, next) => req.container.resolve("videoController").getAllVideos(req, res, next)
);

export default router;