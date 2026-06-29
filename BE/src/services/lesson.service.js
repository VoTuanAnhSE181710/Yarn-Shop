import { Lesson } from "../models/Model.js";

class LessonService {
    #lessonModel

    constructor() {
        this.#lessonModel = Lesson;
    }

    /**
     * Create a standalone lesson
     * @param {Object} data
     * @param {string} data.title
     * @param {number} data.order
     * @param {string} data.videoUrl
     * @param {number} data.duration
     * @param {Array} data.linkedProduct - [{productId}]
     * @param {Array} data.linkedCombo - [{comboId}]
     * @param {boolean} data.isPreview
     */
    createLesson = async (data) => {
        const lesson = await this.#lessonModel.create(data);
        return lesson;
    }

    /**
     * Get all lessons (with optional filters)
     * @param {Object} filter
     */
    getLessons = async (filter = {}) => {
        const lessons = await this.#lessonModel.find(filter)
            .sort({ order: 1 })
            .lean();
        return lessons;
    }

    /**
     * Get a single lesson by ID
     * @param {string} lessonId
     */
    getLessonById = async (lessonId) => {
        const lesson = await this.#lessonModel.findById(lessonId).lean();

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        return lesson;
    }

    /**
     * Update a lesson
     * @param {string} lessonId
     * @param {Object} updateData
     */
    updateLesson = async (lessonId, updateData) => {
        const lesson = await this.#lessonModel.findById(lessonId);

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        Object.assign(lesson, updateData);
        await lesson.save();

        return lesson;
    }

    /**
     * Delete a lesson
     * @param {string} lessonId
     */
    deleteLesson = async (lessonId) => {
        const lesson = await this.#lessonModel.findById(lessonId);

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        await this.#lessonModel.findByIdAndDelete(lessonId);

        return { message: "Lesson deleted successfully" };
    }
}

export default LessonService;