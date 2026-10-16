import { Lesson, Course } from "../models/Model.js";
import { NotFoundError, BadRequestError } from "../error/error.js";

const PRODUCT_POPULATE = {
    path: "linkedProduct.productId",
    select: "name image category variants averageRating totalRatings isActive",
};

class LessonService {
    #lessonModel

    constructor() {
        this.#lessonModel = Lesson;
    }

    #formatLessonResponse = (lesson) => {
        if (!lesson) return null;

        const rawProducts = Array.isArray(lesson.linkedProduct) ? lesson.linkedProduct
            : Array.isArray(lesson.linkedProducts) ? lesson.linkedProducts : [];
        const linkedProduct = rawProducts.map(item => {
            const ref = item.productId || item;
            // populated product is a document/object with its own _id; otherwise a bare ObjectId
            const productId = ref && ref._id ? (ref.toObject ? ref.toObject() : ref) : ref.toString();
            return {
                productId,
                variantId: item.variantId ? item.variantId.toString() : undefined,
                timestamp: item.timestamp || 0,
                note: item.note || ""
            };
        });

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
     * Ensure each linked product timestamp (seconds) fits within the lesson duration (minutes).
     * Skipped when duration is 0/unknown.
     */
    #validateTimestamps = (linkedProduct, duration) => {
        if (!Array.isArray(linkedProduct) || !duration) return;
        const maxSeconds = duration * 60;
        for (const item of linkedProduct) {
            const ts = item.timestamp || 0;
            if (ts < 0 || ts > maxSeconds) {
                throw new BadRequestError(`Timestamp ${ts}s must be between 0 and lesson duration (${maxSeconds}s)`);
            }
        }
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
        this.#validateTimestamps(data.linkedProduct, data.duration);
        const lesson = await this.#lessonModel.create(data);
        await lesson.populate(PRODUCT_POPULATE);
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
            .populate(PRODUCT_POPULATE)
            .lean();
        return lessons.map(lesson => this.#formatLessonResponse(lesson));
    }

    /**
     * Get a single lesson by ID
     * @param {string} lessonId
     */
    getLessonById = async (lessonId) => {
        const lesson = await this.#lessonModel.findById(lessonId)
            .select("-__v")
            .populate(PRODUCT_POPULATE)
            .lean();

        if (!lesson) {
            throw new NotFoundError("Lesson not found");
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
            throw new NotFoundError("Lesson not found");
        }

        const durationChanged = updateData.duration !== undefined && updateData.duration !== lesson.duration;

        this.#validateTimestamps(
            updateData.linkedProduct ?? lesson.linkedProduct,
            updateData.duration ?? lesson.duration
        );

        Object.assign(lesson, updateData);
        await lesson.save();
        await lesson.populate(PRODUCT_POPULATE);

        if (durationChanged) {
            const courses = await Course.find({ linkedLessons: lessonId });
            for (const course of courses) {
                const populatedCourse = await Course.findById(course._id).populate("linkedLessons");
                if (populatedCourse) {
                    const validLessons = (populatedCourse.linkedLessons || []).filter(l => l != null);
                    populatedCourse.totalLessons = validLessons.length;
                    populatedCourse.totalDuration = validLessons.reduce((sum, l) => sum + (l.duration || 0), 0);
                    await populatedCourse.save();
                }
            }
        }

        return this.#formatLessonResponse(lesson);
    }

    /**
     * Delete a lesson
     * @param {string} lessonId
     */
    deleteLesson = async (lessonId) => {
        const lesson = await this.#lessonModel.findById(lessonId);

        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }

        await this.#lessonModel.findByIdAndDelete(lessonId);

        const courses = await Course.find({ linkedLessons: lessonId });
        for (const course of courses) {
            course.linkedLessons = (course.linkedLessons || []).filter(
                (id) => id.toString() !== lessonId.toString()
            );
            await course.save();

            const populatedCourse = await Course.findById(course._id).populate("linkedLessons");
            if (populatedCourse) {
                const validLessons = (populatedCourse.linkedLessons || []).filter(l => l != null);
                populatedCourse.totalLessons = validLessons.length;
                populatedCourse.totalDuration = validLessons.reduce((sum, l) => sum + (l.duration || 0), 0);
                await populatedCourse.save();
            }
        }

        return { message: "Lesson deleted successfully" };
    }
}

export default LessonService;