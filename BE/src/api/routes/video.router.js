import express from "express";
import { authentication, validateData, checkManagePermission } from "../middlewares/middleware.js";
import {
    getUploadUrlSchema,
    confirmUploadSchema,
    updateVideoSchema,
    replaceVideoSchema,
    videoQuerySchema,
} from "../../validators/video.validator.js";

const videoRouter = express.Router();

// POST /api/v1/videos/upload-url - Lấy presigned URL để upload
videoRouter.post(
    "/upload-url",
    authentication,
    validateData(getUploadUrlSchema),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.getUploadUrl(req, res, next);
    }
);

// POST /api/v1/videos/:videoId/confirm - Xác nhận upload hoàn tất
videoRouter.post(
    "/:videoId/confirm",
    authentication,
    validateData(confirmUploadSchema),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.confirmUpload(req, res, next);
    }
);

// GET /api/v1/videos - Danh sách video của current user
videoRouter.get(
    "/",
    authentication,
    validateData(videoQuerySchema, "query"),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.getMyVideos(req, res, next);
    }
);

// GET /api/v1/videos/:videoId - Chi tiết video (public hoặc auth tuỳ visibility)
videoRouter.get(
    "/:videoId",
    async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                try {
                    await new Promise((resolve, reject) => {
                        authentication(req, res, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    // Check manage permission if authenticated
                    await checkManagePermission("Video")(req, res, () => {});
                } catch {
                    req.user = undefined;
                    req.manageVideoPermission = false;
                }
            }
            next();
        } catch (error) {
            next();
        }
    },
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.getById(req, res, next);
    }
);

// PUT /api/v1/videos/:videoId - Cập nhật metadata video
videoRouter.put(
    "/:videoId",
    authentication,
    checkManagePermission("Video"),
    validateData(updateVideoSchema),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.update(req, res, next);
    }
);

// POST /api/v1/videos/:videoId/replace - Re-upload file video
videoRouter.post(
    "/:videoId/replace",
    authentication,
    checkManagePermission("Video"),
    validateData(replaceVideoSchema),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.replace(req, res, next);
    }
);

// DELETE /api/v1/videos/:videoId - Xoá video
videoRouter.delete(
    "/:videoId",
    authentication,
    checkManagePermission("Video"),
    (req, res, next) => {
        const controller = req.container.resolve("videoController");
        controller.delete(req, res, next);
    }
);

export default videoRouter;