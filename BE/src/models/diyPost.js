import mongoose from "mongoose";

const diyPostSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: [true, "Title is required!"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required!"],
    },
    images: [{
        type: String,
    }],
    tags: [{
        type: String,
    }],
    linkedComboId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
        default: null,
    },
    likeCount: {
        type: Number,
        default: 0,
    },
    saveCount: {
        type: Number,
        default: 0,
    },
    purchaseCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    }
}, {
    timestamps: true
});

const DIYPost = mongoose.model("DIYPost", diyPostSchema, "diyposts");
export default DIYPost;