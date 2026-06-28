import mongoose from 'mongoose';
import { Lesson, Course } from "../models/Model.js";

class LessonService {
    #lessonModel
    #courseModel

    constructor() {
        this.#lessonModel = Lesson;
        this.#courseModel = Course;
    }

    /**
     * Recalculate course totalDuration and totalLessons from its lessons
     * @param {string} courseId
     */
    #recalculateCourseStats = async (courseId) => {
        const stats = await this.#lessonModel.aggregate([
            { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
            {
                $group: {
                    _id: "$courseId",
                    totalDuration: { $sum: "$duration" },
                    totalLessons: { $sum: 1 },
                },
            },
        ]);

        const update = stats.length > 0
            ? { totalDuration: stats[0].totalDuration, totalLessons: stats[0].totalLessons }
            : { totalDuration: 0, totalLessons: 0 };

        await this.#courseModel.findByIdAndUpdate(courseId, update);
    }

    /**
     * Create a lesson in a course
     * @param {string} courseId
     * @param {Object} data
     */
    createLesson = async (courseId, data) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });
        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        const lesson = await this.#lessonModel.create({ ...data, courseId });

        await this.#recalculateCourseStats(courseId);

        return lesson;
    }

    /**
     * Get all lessons of a course sorted by order
     * @param {string} courseId
     */
    getLessonsByCourseId = async (courseId) => {
        const lessons = await this.#lessonModel.find({ courseId })
            .sort({ order: 1 })
            .lean();

        return lessons;
    }

    /**
     * Get a single lesson by ID (within a course)
     * @param {string} courseId
     * @param {string} lessonId
     */
    getLessonById = async (courseId, lessonId) => {
        const lesson = await this.#lessonModel.findOne({ _id: lessonId, courseId });

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        return lesson;
    }

    /**
     * Update a lesson
     * @param {string} courseId
     * @param {string} lessonId
     * @param {Object} updateData
     */
    updateLesson = async (courseId, lessonId, updateData) => {
        const lesson = await this.#lessonModel.findOne({ _id: lessonId, courseId });

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        Object.assign(lesson, updateData);
        await lesson.save();

        // If duration or order changed, recalculate course stats
        if (updateData.duration !== undefined) {
            await this.#recalculateCourseStats(courseId);
        }

        return lesson;
    }

    /**
     * Delete a lesson
     * @param {string} courseId
     * @param {string} lessonId
     */
    deleteLesson = async (courseId, lessonId) => {
        const lesson = await this.#lessonModel.findOne({ _id: lessonId, courseId });

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        await this.#lessonModel.findByIdAndDelete(lessonId);

        await this.#recalculateCourseStats(courseId);

        return { message: "Lesson deleted successfully" };
    }
}

export default LessonService;