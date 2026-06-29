class VideoController {
    #videoService

    constructor({ videoService }) {
        this.#videoService = videoService;
    }

    /**
     * POST /api/v1/videos/upload-url - Get presigned upload URL
     * Access: User
     */
    getUploadUrl = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { filename, mimeType, size, title, description, visibility } = req.body;

            const result = await this.#videoService.generateUploadUrl({
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
     * POST /api/v1/videos/:videoId/confirm - Confirm upload complete
     * Access: Owner
     */
    confirmUpload = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId } = req.user;
            const { duration } = req.body;

            const result = await this.#videoService.confirmUpload(videoId, duration, userId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos/my - Get current user's videos
     * Access: User
     */
    getMyVideos = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { status, visibility, page, limit } = req.query;

            const result = await this.#videoService.getMyVideos({
                uploaderUId: userId,
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
     * GET /api/v1/admin/videos - Get all videos (Admin/Staff)
     * Access: Admin, Staff
     */
    getAllVideos = async (req, res, next) => {
        try {
            const { uploaderUId, status, visibility, page, limit } = req.query;

            const result = await this.#videoService.getAllVideos({
                uploaderUId,
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
     * GET /api/v1/videos/:id - Get video detail
     * Access: Public (if visibility=public) / Auth (if private/unlisted)
     */
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = req.user || null;

            const video = await this.#videoService.getVideoById(id, user);

            res.status(200).json(video);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/videos/:id - Update video metadata
     * Access: Owner, Admin, Staff
     */
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { userId, roleName } = req.user;
            const updateData = req.body;

            const video = await this.#videoService.updateVideo(id, updateData, userId, roleName);

            res.status(200).json(video);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/videos/:videoId/replace - Re-upload video file
     * Access: Owner, Admin, Staff
     */
    replaceVideo = async (req, res, next) => {
        try {
            const { videoId } = req.params;
            const { userId, roleName } = req.user;
            const { filename, mimeType, size } = req.body;

            const result = await this.#videoService.replaceVideo(
                videoId,
                { filename, mimeType, size },
                userId,
                roleName
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/videos/:id - Delete video
     * Access: Owner, Admin, Staff
     */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { userId, roleName } = req.user;

            const result = await this.#videoService.deleteVideo(id, userId, roleName);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default VideoController;