import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required!"],
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
        enum: ["beginner", "mid", "pro"],
        required: [true, "Level is required!"],
    },
    linkedLessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
    }],
    tags: [{
        type: String,
    }],
    linkedCombo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
    }],
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    totalDuration: {
        type: Number,
        default: 0,
    },
    totalLessons: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    enrolledCount: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true
});

const Course = mongoose.model("Course", courseSchema, "courses");
export default Course;