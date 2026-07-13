import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Video title is required!"],
        trim: true,
    },
    description: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        enum: ["community", "premium"],
        required: [true, "Video type is required!"],
    },
    url: {
        type: String,
        required: [true, "Video URL is required!"],
    },
    thumbnail: {
        type: {
            url: { type: String, default: null },
            publicId: { type: String, default: null },
        },
        required: false,
    },
    duration: {
        type: Number, // in seconds
        default: 0,
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: false,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    viewCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "APPROVED"
    },
    attachedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    attachedKits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit"
    }],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        score: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for searching
videoSchema.index({ title: "text", description: "text", tags: "text" });

const Video = mongoose.model("Video", videoSchema, "videos");
export default Video;