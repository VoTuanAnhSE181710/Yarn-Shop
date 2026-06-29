import { Video } from "../models/Model.js";
import { generatePresignedUploadUrl, getVideoCdnUrl } from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from "../error/error.js";

class VideoService {
    #videoModel

    constructor() {
        this.#videoModel = Video;
    }

    /**
     * Generate a presigned upload URL for a new video
     * @param {Object} param
     * @param {string} param.filename
     * @param {string} param.mimeType
     * @param {number} param.size
     * @param {string} param.title
     * @param {string} param.description
     * @param {"public"|"private"|"unlisted"} param.visibility
     * @param {string} param.uploaderUId - User ObjectId
     */
    generateUploadUrl = async ({ filename, mimeType, size, title, description, visibility, uploaderUId }) => {
        // Validate MIME type
        if (!mimeType || !mimeType.startsWith("video/")) {
            throw new BadRequestError("Invalid mimeType. Only video/* types are accepted.");
        }

        // Validate size (max 5GB)
        const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
        if (size > MAX_SIZE) {
            throw new BadRequestError("File size exceeds the maximum limit of 5 GB.");
        }

        const videoId = uuidv4();
        const extension = filename.split(".").pop() || "mp4";
        const s3Key = `videos/${videoId}.${extension}`;

        // Create video record with "uploading" status
        const video = await this.#videoModel.create({
            title,
            description: description || "",
            uploaderUId,
            mimeType,
            size,
            status: "uploading",
            visibility: visibility || "private",
            s3Key,
        });

        // Generate presigned URL
        const { uploadUrl, expiresAt } = await generatePresignedUploadUrl(s3Key, mimeType);

        return {
            videoId: video._id,
            uploadUrl,
            expiresAt,
        };
    }

    /**
     * Confirm that upload is complete
     * @param {string} videoId
     * @param {number} duration
     * @param {string} userId - requesting user id
     */
    confirmUpload = async (videoId, duration, userId) => {
        const video = await this.#videoModel.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Only the uploader can confirm
        if (video.uploaderUId.toString() !== userId) {
            throw new ForbiddenError("You are not the owner of this video");
        }

        if (video.status !== "uploading") {
            throw new BadRequestError("Video is not in uploading status");
        }

        // Set video URL from S3 key
        video.videoUrl = getVideoCdnUrl(video.s3Key);
        video.duration = duration || 0;
        video.status = "processing";
        await video.save();

        return {
            id: video._id,
            status: video.status,
            title: video.title,
            videoUrl: null, // Not ready yet
            createdAt: video.createdAt,
        };
    }

    /**
     * Get videos of the current user with filtering
     * @param {Object} param
     * @param {string} param.uploaderUId
     * @param {"uploading"|"processing"|"ready"|"failed"} [param.status]
     * @param {"public"|"private"|"unlisted"} [param.visibility]
     * @param {number} [param.page=1]
     * @param {number} [param.limit=20]
     */
    getMyVideos = async ({ uploaderUId, status, visibility, page = 1, limit = 20 }) => {
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
     * Get all videos (Admin / Staff)
     * @param {Object} param
     * @param {string} [param.uploaderUId]
     * @param {string} [param.status]
     * @param {string} [param.visibility]
     * @param {number} [param.page=1]
     * @param {number} [param.limit=20]
     */
    getAllVideos = async ({ uploaderUId, status, visibility, page = 1, limit = 20 }) => {
        const query = {};

        if (uploaderUId) query.uploaderUId = uploaderUId;
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
     * Get video by ID with access control
     * @param {string} id
     * @param {Object} [user] - current user (optional for public videos)
     */
    getVideoById = async (id, user = null) => {
        const video = await this.#videoModel.findById(id)
            .populate("uploaderUId", "username fullName avatar")
            .populate("linkedLessonId", "title order");

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Access control
        if (video.visibility !== "public") {
            if (!user) {
                throw new ForbiddenError("You do not have permission to view this video");
            }

            const isOwner = video.uploaderUId._id.toString() === user.userId;
            const isAdminOrStaff = user.roleName === "admin" || user.roleName === "staff";

            if (!isOwner && !isAdminOrStaff) {
                throw new ForbiddenError("You do not have permission to view this video");
            }
        }

        // Increment view count (only for public videos or when viewed by non-owner)
        if (video.visibility === "public" || (user && video.uploaderUId._id.toString() !== user.userId)) {
            await this.#videoModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
            video.viewCount += 1;
        }

        return video;
    }

    /**
     * Update video metadata
     * @param {string} id
     * @param {Object} updateData
     * @param {string} userId - requesting user id
     * @param {string} userRole - requesting user role
     */
    updateVideo = async (id, updateData, userId, userRole) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Check permission: owner or admin/staff
        const isOwner = video.uploaderUId.toString() === userId;
        const isAdminOrStaff = userRole === "admin" || userRole === "staff";

        if (!isOwner && !isAdminOrStaff) {
            throw new ForbiddenError("You do not have permission to update this video");
        }

        // Cannot update if video is not ready (unless admin/staff)
        if (video.status !== "ready" && !isAdminOrStaff) {
            throw new BadRequestError("Video is not ready yet. Cannot update metadata while processing.");
        }

        // Allowed fields for update
        const allowedFields = ["title", "description", "visibility", "tags", "linkedLessonId"];
        const sanitizedData = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                sanitizedData[field] = updateData[field];
            }
        }

        Object.assign(video, sanitizedData);
        await video.save();

        return video;
    }

    /**
     * Generate presigned URL for re-uploading a video
     * @param {string} videoId
     * @param {Object} param
     * @param {string} param.filename
     * @param {string} param.mimeType
     * @param {number} param.size
     * @param {string} userId
     * @param {string} userRole
     */
    replaceVideo = async (videoId, { filename, mimeType, size }, userId, userRole) => {
        const video = await this.#videoModel.findById(videoId);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Check permission
        const isOwner = video.uploaderUId.toString() === userId;
        const isAdminOrStaff = userRole === "admin" || userRole === "staff";

        if (!isOwner && !isAdminOrStaff) {
            throw new ForbiddenError("You do not have permission to replace this video");
        }

        // Validate MIME type
        if (!mimeType || !mimeType.startsWith("video/")) {
            throw new BadRequestError("Invalid mimeType. Only video/* types are accepted.");
        }

        // Validate size (max 5GB)
        const MAX_SIZE = 5 * 1024 * 1024 * 1024;
        if (size > MAX_SIZE) {
            throw new BadRequestError("File size exceeds the maximum limit of 5 GB.");
        }

        const extension = filename.split(".").pop() || "mp4";
        const s3Key = `videos/${videoId}.${extension}`;

        // Update video record
        video.s3Key = s3Key;
        video.mimeType = mimeType;
        video.size = size;
        video.status = "uploading";
        video.videoUrl = null;
        await video.save();

        // Generate presigned URL
        const { uploadUrl, expiresAt } = await generatePresignedUploadUrl(s3Key, mimeType);

        return {
            uploadUrl,
            expiresAt,
        };
    }

    /**
     * Delete a video
     * @param {string} id
     * @param {string} userId
     * @param {string} userRole
     */
    deleteVideo = async (id, userId, userRole) => {
        const video = await this.#videoModel.findById(id);

        if (!video) {
            throw new NotFoundError("Video not found");
        }

        // Check permission
        const isOwner = video.uploaderUId.toString() === userId;
        const isAdminOrStaff = userRole === "admin" || userRole === "staff";

        if (!isOwner && !isAdminOrStaff) {
            throw new ForbiddenError("You do not have permission to delete this video");
        }

        // Check if video is linked to a lesson
        if (video.linkedLessonId) {
            throw new ConflictError("Video is currently linked to a lesson. Please unlink it first.");
        }

        await this.#videoModel.findByIdAndDelete(id);

        return { message: "Video đã được xoá thành công." };
    }
}

export default VideoService;