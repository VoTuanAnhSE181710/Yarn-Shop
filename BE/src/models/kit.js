import mongoose from "mongoose";

const kitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Kit name is required!"],
        trim: true,
    },
    description: {
        type: String,
        default: ""
    },
    thumbnail: {
        type: String,
        default: ""
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    linkedCourseIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Kit = mongoose.model("Kit", kitSchema, "kits");
export default Kit;
