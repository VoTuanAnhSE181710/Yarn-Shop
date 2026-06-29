class VideoController {
    #videoService

    constructor({ videoService }) {
        this.#videoService = videoService;
    }

    /**
     * POST /api/v1/videos/upload-url - Lấy presigned URL để upload
     * Auth: User đã đăng nhập
     */
    getUploadUrl = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { filename, mimeType, size, title, description, visibility } = req.body;

            const result = await this.#videoService.getUploadUrl({
                filename,
                mimeType,
                size,
                title,
                description,
                visibility,
                uploaderUId: userId,
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/videos/:videoId/confirm - Xác nhận upload hoàn tất
     * Auth: Chủ video
     */
    confirmUpload = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId } = req.user;
            const { duration } = req.body;

            const result = await this.#videoService.confirmUpload(
                videoId,
                { duration },
                userId,
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos - Danh sách video của current user
     * Auth: User đã đăng nhập
     */
    getMyVideos = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { status, visibility, page, limit } = req.query;

            const result = await this.#videoService.getMyVideos(userId, {
                status,
                visibility,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/admin/videos - Danh sách tất cả video (Admin/Staff)
     * Auth: user có permission "manage" Video
     */
    getAllVideos = async (req, res, next) => {
        try {
            const { uploaderId, status, visibility, page, limit } = req.query;

            const result = await this.#videoService.getAllVideos({
                uploaderId,
                status,
                visibility,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos/:videoId - Chi tiết video
     * Auth: Public nếu visibility=public, ngược lại cần auth & ownership
     */
    getById = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId } = req.user || {};
            const hasManagePermission = req.manageVideoPermission || false;

            const video = await this.#videoService.getVideoById(videoId, userId, hasManagePermission);

            res.status(200).json(video);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/videos/:videoId - Cập nhật metadata video
     * Auth: Chủ video hoặc user có "manage" permission
     */
    update = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId } = req.user;
            const updateData = req.body;
            const hasManagePermission = req.manageVideoPermission || false;

            const video = await this.#videoService.updateVideo(videoId, updateData, userId, hasManagePermission);

            res.status(200).json(video);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/videos/:videoId/replace - Re-upload file video
     * Auth: Chủ video hoặc user có "manage" permission
     */
    replace = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId } = req.user;
            const { filename, mimeType, size } = req.body;
            const hasManagePermission = req.manageVideoPermission || false;

            const result = await this.#videoService.replaceVideo(
                videoId,
                { filename, mimeType, size },
                userId,
                hasManagePermission,
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/videos/:videoId - Xoá video
     * Auth: Chủ video hoặc user có "manage" permission
     */
    delete = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId } = req.user;
            const hasManagePermission = req.manageVideoPermission || false;

            const result = await this.#videoService.deleteVideo(videoId, userId, hasManagePermission);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default VideoController;