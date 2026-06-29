import express from "express";
import { authentication, checkPermission, validateData } from "../middlewares/middleware.js";
import { adminVideoQuerySchema } from "../../validators/video.validator.js";

const adminVideoRouter = express.Router();

// GET /api/v1/admin/videos - Danh sách tất cả video (Admin/Staff)
// Chỉ user có permission "manage" Video mới xem được
adminVideoRouter.get(
    "/",
    authentication,
    checkPermission("Video", "manage"),
    validateData(adminVideoQuerySchema, "query"),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.getAllVideos(req, res, next);
    }
);

export default adminVideoRouter;
