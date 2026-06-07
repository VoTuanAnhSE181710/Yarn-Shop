class VideoController {
    #videoService

    constructor({ videoService }) {
        this.#videoService = videoService;
    }

    /**
     * POST /api/v1/videos - Create a video
     * Access: Freemium & Premium (community), Staff (premium)
     */
    create = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const videoData = req.body;

            const video = await this.#videoService.createVideo({
                ...videoData,
                uploader: userId,
            });

            res.status(201).json({
                status: 'success',
                data: { video },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos - Get videos list with filtering
     * Access: All authenticated users
     */
    getAll = async (req, res, next) => {
        try {
            const { type, category, search, page, limit, sort } = req.query;

            const result = await this.#videoService.getVideos({
                type,
                category,
                search,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                sort,
            });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos/premium - Get premium videos
     * Access: Premium users only
     */
    getPremiumVideos = async (req, res, next) => {
        try {
            const { category, search, page, limit, sort } = req.query;

            const result = await this.#videoService.getVideos({
                type: 'premium',
                category,
                search,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                sort,
            });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos/my - Get my uploaded videos
     * Access: Uploader (Freemium/Premium)
     */
    getMyVideos = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { page, limit } = req.query;

            const result = await this.#videoService.getMyVideos(
                userId,
                parseInt(page) || 1,
                parseInt(limit) || 20
            );

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/videos/:id - Get video by ID
     * Access: All authenticated users
     */
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const video = await this.#videoService.getVideoById(id);

            res.status(200).json({
                status: 'success',
                data: { video },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/videos/:id - Update video
     * Access: Uploader or Staff
     */
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const updateData = req.body;

            const video = await this.#videoService.updateVideo(id, updateData, userId);

            res.status(200).json({
                status: 'success',
                data: { video },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/videos/:id - Delete video (soft delete)
     * Access: Uploader or Staff
     */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { userId } = req.user;

            const result = await this.#videoService.deleteVideo(id, userId);

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default VideoController;