import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Course title is required!"],
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    thumbnail: {
        type: String,
        default: null,
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: [true, "Course level is required!"],
    },
    tags: [{
        type: String,
        trim: true,
    }],
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator is required!"],
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
        min: 0,
        max: 5,
    },
    enrolledCount: {
        type: Number,
        default: 0,
    },
    linkedComboIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "KitCombo",
    }],
    isPublished: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

courseSchema.index({ title: "text", description: "text", tags: "text" });
courseSchema.index({ level: 1 });
courseSchema.index({ creatorId: 1 });
courseSchema.index({ isPublished: 1, deletedAt: 1 });

const Course = mongoose.model("Course", courseSchema, "courses");
export default Course;