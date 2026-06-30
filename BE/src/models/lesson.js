import mongoose from "mongoose";

const linkedProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
}, { _id: false });

const linkedComboSchema = new mongoose.Schema({
    comboId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
        required: true,
    },
}, { _id: false });

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required!"],
        trim: true,
    },
    order: {
        type: Number,
        required: [true, "Order is required!"],
    },
    videoUrl: {
        type: String,
        required: [true, "Video URL is required!"],
    },
    duration: {
        type: Number,
        default: 0,
    },
    linkedProduct: [linkedProductSchema],
    linkedCombo: [linkedComboSchema],
    isPreview: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

const Lesson = mongoose.model("Lesson", lessonSchema, "lessons");
export default Lesson;