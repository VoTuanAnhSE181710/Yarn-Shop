import mongoose from "mongoose";

const linkedProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    timestamp: {
        type: Number,
        required: [true, "Timestamp is required!"],
    },
    name: {
        type: String,
        required: [true, "Name is required!"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required!"],
    },
    thumbnail: {
        type: String,
        required: [true, "Thumbnail is required!"],
    }
}, { _id: false });

const linkedComboSchema = new mongoose.Schema({
    comboId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
        required: true,
    },
    timestamp: {
        type: Number,
        required: [true, "Timestamp is required!"],
    },
    name: {
        type: String,
        required: [true, "Name is required!"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required!"],
    },
    thumbnail: {
        type: String,
        required: [true, "Thumbnail is required!"],
    }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
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
        required: [true, "Duration is required!"],
    },
    linkedProducts: [linkedProductSchema],
    linkedCombos: [linkedComboSchema],
    isPreview: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

const Lesson = mongoose.model("Lesson", lessonSchema, "lessons");
export default Lesson;