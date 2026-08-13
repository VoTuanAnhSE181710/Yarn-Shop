import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    completedLessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson"
    }],
    isCompleted: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    hasNewContent: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

// Ensure a user only has one progress document per course
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema, "course_progresses");
export default CourseProgress;
