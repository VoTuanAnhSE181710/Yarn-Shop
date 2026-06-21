import mongoose from "mongoose";

const linkedProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    timestamp: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    thumbnail: {
        type: String,
        default: null,
    },
}, { _id: false });

const lessonSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course ID is required!"],
        index: true,
    },
    title: {
        type: String,
        required: [true, "Lesson title is required!"],
        trim: true,
    },
    order: {
        type: Number,
        required: [true, "Lesson order is required!"],
    },
    videoUrl: {
        type: String,
        required: [true, "Video URL is required!"],
    },
    duration: {
        type: Number,
        default: 0,
    },
    linkedProducts: {
        type: [linkedProductSchema],
        default: [],
    },
    isPreview: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });

const Lesson = mongoose.model("Lesson", lessonSchema, "lessons");
export default Lesson;