import { Lesson } from "../models/Model.js";

class LessonService {
    #lessonModel

    constructor() {
        this.#lessonModel = Lesson;
    }

    #formatLessonResponse = (lesson) => {
        if (!lesson) return null;

        let linkedProduct = [];
        if (lesson.linkedProduct && Array.isArray(lesson.linkedProduct)) {
            linkedProduct = lesson.linkedProduct.map(item => ({
                productId: (item.productId || item).toString()
            }));
        } else if (lesson.linkedProducts && Array.isArray(lesson.linkedProducts)) {
            linkedProduct = lesson.linkedProducts.map(item => ({
                productId: (item.productId || item).toString()
            }));
        }

        let linkedCombo = [];
        if (lesson.linkedCombo && Array.isArray(lesson.linkedCombo)) {
            linkedCombo = lesson.linkedCombo.map(item => ({
                comboId: (item.comboId || item).toString()
            }));
        } else if (lesson.linkedCombos && Array.isArray(lesson.linkedCombos)) {
            linkedCombo = lesson.linkedCombos.map(item => ({
                comboId: (item.comboId || item).toString()
            }));
        }

        const formatted = {
            _id: lesson._id.toString(),
            title: lesson.title,
            order: lesson.order || 0,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration || 0,
            linkedProduct,
            linkedCombo,
            isPreview: !!lesson.isPreview,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt
        };

        return formatted;
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
        return this.#formatLessonResponse(lesson);
    }

    /**
     * Get all lessons (with optional filters)
     * @param {Object} filter
     */
    getLessons = async (filter = {}) => {
        const lessons = await this.#lessonModel.find(filter)
            .sort({ order: 1 })
            .select("-__v")
            .lean();
        return lessons.map(lesson => this.#formatLessonResponse(lesson));
    }

    /**
     * Get a single lesson by ID
     * @param {string} lessonId
     */
    getLessonById = async (lessonId) => {
        const lesson = await this.#lessonModel.findById(lessonId).select("-__v").lean();

        if (!lesson) {
            const error = new Error("Lesson not found");
            error.statusCode = 404;
            throw error;
        }

        return this.#formatLessonResponse(lesson);
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

        return this.#formatLessonResponse(lesson);
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