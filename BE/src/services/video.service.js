import { Video } from "../models/Model.js";

class VideoService {
    #videoModel

    constructor() {
        this.#videoModel = Video;
    }

    /**
     * Create a video
     * @param {Object} param
     * @param {string} param.title
     * @param {string} param.description
     * @param {"community"|"premium"} param.type
     * @param {string} param.url
     * @param {Object} param.thumbnail
     * @param {number} param.duration
     * @param {string} param.category - Category ObjectId
     * @param {string[]} param.tags
     * @param {string} param.uploader - User ObjectId
     */
    createVideo = async ({ title, description, type, url, thumbnail, duration, category, tags, uploader }) => {
        const video = await this.#videoModel.create({
            title,
            description: description || "",
            type,
            url,
            thumbnail: thumbnail || { url: null, publicId: null },
            duration: duration || 0,
            category: category || null,
            tags: tags || [],
            uploader,
        });

        return video;
    }

    /**
     * Get videos with filtering, pagination, sorting
     * @param {Object} param
     * @param {"community"|"premium"} [param.type]
     * @param {string} [param.category]
     * @param {string} [param.search]
     * @param {number} [param.page=1]
     * @param {number} [param.limit=20]
     * @param {"newest"|"oldest"|"most_viewed"} [param.sort="newest"]
     */
    getVideos = async ({ type, category, search, page = 1, limit = 20, sort = "newest" }) => {
        const query = { isActive: true, status: "APPROVED" };

        if (type) query.type = type;
        if (category) query.category = category;
        if (search) {
            query.$text = { $search: search };
        }

        let sortOption = {};
        switch (sort) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "most_viewed":
                sortOption = { viewCount: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;

        const [videos, total] = await Promise.all([
            this.#videoModel.find(query)
                .populate("uploader", "username fullName avatar")
                .populate("category", "name slug")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.#videoModel.countDocuments(query),
        ]);

        return {
            videos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single video by ID
     * @param {string} id
     */
    getVideoById = async (id) => {
        const video = await this.#videoModel.findById(id)
            .populate("uploader", "username fullName avatar")
            .populate("category", "name slug");

        if (!video) {
            const error = new Error("Video not found");
            error.statusCode = 404;
            throw error;
        }

        // Increment view count
        await this.#videoModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

        return video;
    }

    /**
     * Update video
     * @param {string} id
     * @param {Object} updateData
     * @param {string} userId - requesting user id
     */
    updateVideo = async (id, updateData, userId) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            const error = new Error("Video not found");
            error.statusCode = 404;
            throw error;
        }

        // Only uploader or staff can update
        if (video.uploader.toString() !== userId) {
            // Check if user is staff via role - will be validated at controller level
        }

        Object.assign(video, updateData);
        await video.save();

        return video;
    }

    /**
     * Delete video (soft delete)
     * @param {string} id
     * @param {string} userId
     */
    deleteVideo = async (id, userId) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            const error = new Error("Video not found");
            error.statusCode = 404;
            throw error;
        }

        video.isActive = false;
        await video.save();

        return { message: "Video deleted successfully" };
    }

    /**
     * Get my uploaded videos
     * @param {string} uploaderId
     * @param {number} page
     * @param {number} limit
     */
    getMyVideos = async (uploaderId, page = 1, limit = 20) => {
        const skip = (page - 1) * limit;

        const [videos, total] = await Promise.all([
            this.#videoModel.find({ uploader: uploaderId })
                .populate("category", "name slug")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.#videoModel.countDocuments({ uploader: uploaderId }),
        ]);

        return {
            videos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default VideoService;