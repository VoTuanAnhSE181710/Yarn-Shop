import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    uploaderUId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: [true, "Video title is required!"],
        trim: true,
    },
    description: {
        type: String,
        default: ""
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
        type: Number, // in seconds
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
}, {
    timestamps: true
});

// Index for searching
videoSchema.index({ title: "text", description: "text", tags: "text" });
videoSchema.index({ uploaderUId: 1, status: 1 });
videoSchema.index({ visibility: 1, status: 1 });

const Video = mongoose.model("Video", videoSchema, "videos");
export default Video;