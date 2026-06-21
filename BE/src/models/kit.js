import mongoose from "mongoose";

const kitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Kit name is required!"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required!"],
    },
    thumbnail: {
        type: String,
        required: [true, "Thumbnail is required!"],
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: [true, "Level is required!"],
    },
    price: {
        type: Number,
        required: [true, "Price is required!"],
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    linkedCourseIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    }],
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

const Kit = mongoose.model("Kit", kitSchema, "kits");
export default Kit;