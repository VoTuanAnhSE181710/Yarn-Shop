import mongoose from "mongoose";

const linkedProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
    },
}, { _id: false });

const linkedComboSchema = new mongoose.Schema({
    comboId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
        required: true,
    },
}, { _id: false });

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
    linkedProduct: {
        type: [linkedProductSchema],
        default: [],
    },
    linkedCombo: {
        type: [linkedComboSchema],
        default: [],
    },
    likeCount: {
        type: Number,
        default: 0,
    },
    purchaseCount: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["Pending", "Done", "Cancel"],
        default: "Pending",
    },
    ratings: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        score: { type: Number, required: true, min: 1, max: 5 }
    }],
    averageRating: {
        type: Number,
        default: 0,
    },
    totalRatings: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true
});

const DIYPost = mongoose.model("DIYPost", diyPostSchema, "diyposts");
export default DIYPost;