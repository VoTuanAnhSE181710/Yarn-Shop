import { Video } from "../models/Model.js";
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from "../error/error.js";

class VideoService {
    #videoModel

    constructor() {
        this.#videoModel = Video;
    }

    /**
     * Check if user is owner of the video
     */
    #isOwner = (video, userId) => {
        return video.uploaderUId.toString() === userId;
    }

    /**
     * 1. Lấy Presigned Upload URL
     * POST /api/videos/upload-url
     */
    getUploadUrl = async ({ filename, mimeType, size, title, description, visibility, uploaderUId }) => {
        // Validate mimeType
        if (!mimeType || !mimeType.startsWith("video/")) {
            throw new BadRequestError("Invalid mimeType. Only video/* types are accepted.");
        }

        // Validate size (max 5GB)
        const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
        if (size > MAX_SIZE) {
            throw new BadRequestError("File size exceeds the maximum limit of 5GB.");
        }

        // Create video record with status "uploading"
        const video = await this.#videoModel.create({
            uploaderUId,
            title,
            description: description || "",
            mimeType,
            size,
            visibility: visibility || "private",
            status: "uploading",
            tags: [],
        });

        // In production, generate a real presigned URL from S3/Cloudinary here
        const uploadUrl = `https://storage.example.com/upload/${video._id}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        return {
            videoId: video._id,
            uploadUrl,
            expiresAt,
        };
    }

    /**
     * 2. Xác nhận Upload hoàn tất
     * POST /api/videos/:videoId/confirm
     */
    confirmUpload = async (videoId, { duration }, userId) => {
        const video = await this.#videoModel.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Only owner can confirm
        if (!this.#isOwner(video, userId)) {
            throw new ForbiddenError("You do not have permission to confirm this upload");
        }

        // Update video status to processing
        video.status = "processing";
        video.duration = duration || 0;
        await video.save();

        return {
            id: video._id,
            status: video.status,
            title: video.title,
            videoUrl: video.videoUrl,
            createdAt: video.createdAt,
        };
    }

    /**
     * 3. Lấy danh sách video của current user
     * GET /api/videos
     */
    getMyVideos = async (uploaderUId, { status, visibility, page = 1, limit = 20 }) => {
        const query = { uploaderUId };

        if (status) query.status = status;
        if (visibility) query.visibility = visibility;

        const skip = (page - 1) * limit;

        const [videos, total] = await Promise.all([
            this.#videoModel.find(query)
                .select("title thumbnailUrl duration status visibility viewCount createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.#videoModel.countDocuments(query),
        ]);

        return {
            data: videos,
            total,
            page,
            limit,
        };
    }

    /**
     * 4. Xem danh sách video (Admin / Staff)
     * GET /api/admin/videos
     */
    getAllVideos = async ({ uploaderId, status, visibility, page = 1, limit = 20 }) => {
        const query = {};

        if (uploaderId) query.uploaderUId = uploaderId;
        if (status) query.status = status;
        if (visibility) query.visibility = visibility;

        const skip = (page - 1) * limit;

        const [videos, total] = await Promise.all([
            this.#videoModel.find(query)
                .populate("uploaderUId", "username fullName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.#videoModel.countDocuments(query),
        ]);

        return {
            data: videos,
            total,
            page,
            limit,
        };
    }

    /**
     * 5. Chi tiết video
     * GET /api/videos/:videoId
     * - Public video: anyone can view
     * - Private/unlisted: only owner or user with "manage" permission
     */
    getVideoById = async (videoId, userId, hasManagePermission) => {
        const video = await this.#videoModel.findById(videoId)
            .populate("uploaderUId", "username fullName avatar");

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Public videos: anyone can view
        if (video.visibility === "public") {
            // Increment view count
            await this.#videoModel.findByIdAndUpdate(videoId, { $inc: { viewCount: 1 } });
            return video;
        }

        // Private/unlisted: only owner or user with manage permission
        if (this.#isOwner(video, userId) || hasManagePermission) {
            // Increment view count
            await this.#videoModel.findByIdAndUpdate(videoId, { $inc: { viewCount: 1 } });
            return video;
        }

        throw new ForbiddenError("You do not have permission to view this video");
    }

    /**
     * 6. Cập nhật video
     * PUT /api/videos/:videoId
     * - Owner can update their own video
     * - User with "manage" permission can update any video
     */
    updateVideo = async (videoId, updateData, userId, hasManagePermission) => {
        const video = await this.#videoModel.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Check permission: owner OR has manage permission
        if (!this.#isOwner(video, userId) && !hasManagePermission) {
            throw new ForbiddenError("You do not have permission to modify this video");
        }

        // Cannot update if video is not in "ready" status (unless has manage permission)
        if (video.status !== "ready" && !hasManagePermission) {
            throw new BadRequestError("Video is not ready yet. Cannot update metadata while processing.");
        }

        // Allowed fields for update
        const allowedFields = ["title", "description", "visibility", "tags", "linkedLessonId"];
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                video[field] = updateData[field];
            }
        }

        await video.save();
        return video;
    }

    /**
     * 7. Thay thế file video (re-upload)
     * POST /api/videos/:videoId/replace
     */
    replaceVideo = async (videoId, { filename, mimeType, size }, userId, hasManagePermission) => {
        const video = await this.#videoModel.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Check permission: owner OR has manage permission
        if (!this.#isOwner(video, userId) && !hasManagePermission) {
            throw new ForbiddenError("You do not have permission to modify this video");
        }

        // Validate mimeType
        if (!mimeType || !mimeType.startsWith("video/")) {
            throw new BadRequestError("Invalid mimeType. Only video/* types are accepted.");
        }

        // Validate size (max 5GB)
        const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
        if (size > MAX_SIZE) {
            throw new BadRequestError("File size exceeds the maximum limit of 5GB.");
        }

        // Reset video status to uploading
        video.status = "uploading";
        video.mimeType = mimeType;
        video.size = size;
        video.videoUrl = null;
        await video.save();

        const uploadUrl = `https://storage.example.com/upload/${video._id}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        return {
            uploadUrl,
            expiresAt,
        };
    }

    /**
     * 8. Xoá video
     * DELETE /api/videos/:videoId
     */
    deleteVideo = async (videoId, userId, hasManagePermission) => {
        const video = await this.#videoModel.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Check permission: owner OR has manage permission
        if (!this.#isOwner(video, userId) && !hasManagePermission) {
            throw new ForbiddenError("You do not have permission to delete this video");
        }

        // Check if video is linked to a lesson
        if (video.linkedLessonId) {
            throw new ConflictError("Video is currently linked to a lesson. Please unlink it first.");
        }

        await this.#videoModel.findByIdAndDelete(videoId);

        return { message: "Video đã được xoá thành công." };
    }
}

export default VideoService;