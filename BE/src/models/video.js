import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Video title is required!"],
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        default: "",
        maxlength: 2000,
    },
    uploaderUId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    videoUrl: {
        type: String,
        default: null,
    },
    thumbnailUrl: {
        type: String,
        default: null,
    },
    duration: {
        type: Number, // seconds
        default: 0,
    },
    size: {
        type: Number, // bytes
        default: 0,
    },
    mimeType: {
        type: String,
        default: "video/mp4",
    },
    status: {
        type: String,
        enum: ["uploading", "processing", "ready", "failed"],
        default: "uploading",
    },
    visibility: {
        type: String,
        enum: ["public", "private", "unlisted"],
        default: "private",
    },
    tags: [{
        type: String,
        trim: true,
    }],
    viewCount: {
        type: Number,
        default: 0,
    },
    linkedLessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        default: null,
    },
    s3Key: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Index for searching
videoSchema.index({ title: "text", description: "text", tags: "text" });
videoSchema.index({ uploaderUId: 1, status: 1 });
videoSchema.index({ status: 1, visibility: 1 });

const Video = mongoose.model("Video", videoSchema, "videos");
export default Video;