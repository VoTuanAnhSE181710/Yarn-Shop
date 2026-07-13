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
     * @param {string[]} [param.attachedProducts] - Array of Product ObjectIds
     * @param {string[]} [param.attachedKits] - Array of Kit ObjectIds
     */
    createVideo = async ({ title, description, type, url, thumbnail, duration, category, tags, uploader, attachedProducts, attachedKits }) => {
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
            attachedProducts: attachedProducts || [],
            attachedKits: attachedKits || [],
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
                .populate("attachedProducts", "name image variants")
                .populate("attachedKits", "name thumbnail price")
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
            .populate("category", "name slug")
            .populate("attachedProducts", "name image variants")
            .populate("attachedKits", "name thumbnail price");

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
     * @param {boolean} [isAdminUpdate=false] - whether this is an admin override
     */
    updateVideo = async (id, updateData, userId, isAdminUpdate = false) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            const error = new Error("Video not found");
            error.statusCode = 404;
            throw error;
        }

        // Only uploader can update (unless admin)
        if (!isAdminUpdate && video.uploader.toString() !== userId.toString()) {
            const error = new Error("You do not have permission to modify this video");
            error.statusCode = 403;
            throw error;
        }

        // Allow update of attachments
        if (updateData.attachedProducts !== undefined) video.attachedProducts = updateData.attachedProducts;
        if (updateData.attachedKits !== undefined) video.attachedKits = updateData.attachedKits;

        Object.assign(video, updateData);
        await video.save();

        return video;
    }

    /**
     * Delete video (soft delete)
     * @param {string} id
     * @param {string} userId
     * @param {boolean} [isAdminUpdate=false]
     */
    deleteVideo = async (id, userId, isAdminUpdate = false) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            const error = new Error("Video not found");
            error.statusCode = 404;
            throw error;
        }

        // Only uploader can delete (unless admin)
        if (!isAdminUpdate && video.uploader.toString() !== userId.toString()) {
            const error = new Error("You do not have permission to delete this video");
            error.statusCode = 403;
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
                .populate("attachedProducts", "name image variants")
                .populate("attachedKits", "name thumbnail price")
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

    /**
     * Rate a video
     * @param {string} id - Video ObjectId
     * @param {string} userId - User ObjectId rating the video
     * @param {number} score - 1 to 5
     */
    rateVideo = async (id, userId, score) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            const error = new Error("Video not found");
            error.statusCode = 404;
            throw error;
        }

        if (score < 1 || score > 5) {
            const error = new Error("Rating score must be between 1 and 5");
            error.statusCode = 400;
            throw error;
        }

        // Check if user already rated
        const existingRatingIndex = video.ratings.findIndex(r => r.user.toString() === userId.toString());

        if (existingRatingIndex !== -1) {
            video.ratings[existingRatingIndex].score = score;
        } else {
            video.ratings.push({ user: userId, score });
        }

        // Calculate average
        const totalScore = video.ratings.reduce((acc, curr) => acc + curr.score, 0);
        video.averageRating = Number((totalScore / video.ratings.length).toFixed(1));

        await video.save();

        return {
            averageRating: video.averageRating,
            totalRatings: video.ratings.length
        };
    }
}

export default VideoService;