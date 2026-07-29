import mongoose from "mongoose";

const kitSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
    },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    products: [{
        _id: false,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: mongoose.Schema.Types.ObjectId },
        quantity: { type: Number, default: 1, min: 1 }
    }],
    isActive: { type: Boolean, default: true },
    ratings: [{
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 }
    }],
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
}, { timestamps: true });

const Kit = mongoose.model("Kit", kitSchema, "kits");
export default Kit;
