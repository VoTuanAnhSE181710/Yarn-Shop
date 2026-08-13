import CourseProgress from "../models/courseProgress.js";

export default class CourseProgressRepository {
    async findProgress(userId, courseId) {
        return CourseProgress.findOne({ userId, courseId }).lean();
    }

    async upsertProgress(userId, courseId, updateData) {
        return CourseProgress.findOneAndUpdate(
            { userId, courseId },
            { $set: updateData },
            { new: true, upsert: true }
        ).lean();
    }

    async addCompletedLesson(userId, courseId, lessonId) {
        return CourseProgress.findOneAndUpdate(
            { userId, courseId },
            { $addToSet: { completedLessons: lessonId } },
            { new: true, upsert: true }
        ).lean();
    }

    async setCourseNewContent(courseId) {
        return CourseProgress.updateMany(
            { courseId, isCompleted: true },
            { $set: { hasNewContent: true } }
        );
    }
}
