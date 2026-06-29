import { Course } from "../models/Model.js";

class CourseService {
    #courseModel

    constructor() {
        this.#courseModel = Course;
    }

    /**
     * Create a new course
     * @param {Object} data - Course data
     * @param {string} data.title
     * @param {string} data.description
     * @param {string} data.thumbnail
     * @param {"beginner"|"mid"|"pro"} data.level
     * @param {string[]} data.linkedLessons - Array of Lesson ObjectIds
     * @param {string[]} data.tags
     * @param {string} data.creatorId - User ObjectId
     * @param {string[]} data.linkedCombo - Array of Kit ObjectIds
     * @param {boolean} data.isPublished
     */
    createCourse = async (data) => {
        const course = await this.#courseModel.create(data);
        return course;
    }

    /**
     * Get courses list with filtering, pagination, sorting
     * @param {Object} param
     * @param {"beginner"|"mid"|"pro"} [param.level]
     * @param {string} [param.tag]
     * @param {string} [param.creatorId]
     * @param {number} [param.page=1]
     * @param {number} [param.limit=20]
     * @param {"newest"|"oldest"|"rating"|"enrolled"} [param.sort="newest"]
     */
    getCourses = async ({ level, tag, creatorId, page = 1, limit = 20, sort = "newest" }) => {
        const query = { isPublished: true, deletedAt: null };

        if (level) query.level = level;
        if (tag) query.tags = tag;
        if (creatorId) query.creatorId = creatorId;

        let sortOption = {};
        switch (sort) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "rating":
                sortOption = { rating: -1 };
                break;
            case "enrolled":
                sortOption = { enrolledCount: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;

        const [courses, total] = await Promise.all([
            this.#courseModel.find(query)
                .populate("creatorId", "username fullName avatar")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.#courseModel.countDocuments(query),
        ]);

        return {
            courses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get course by ID, populating linked lessons
     * @param {string} id
     */
    getCourseById = async (id) => {
        const course = await this.#courseModel.findOne({ _id: id, deletedAt: null })
            .populate("creatorId", "username fullName avatar")
            .populate("linkedLessons")
            .lean();

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        return course;
    }

    /**
     * Update course
     * @param {string} id
     * @param {Object} updateData
     */
    updateCourse = async (id, updateData) => {
        const course = await this.#courseModel.findOne({ _id: id, deletedAt: null });

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        Object.assign(course, updateData);
        await course.save();

        return course;
    }

    /**
     * Delete course (soft delete)
     * @param {string} id
     */
    deleteCourse = async (id) => {
        const course = await this.#courseModel.findOne({ _id: id, deletedAt: null });

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        course.deletedAt = new Date();
        course.isPublished = false;
        await course.save();

        return { message: "Course deleted successfully" };
    }

    /**
     * Recalculate totalLessons and totalDuration from populated linkedLessons
     * @param {string} courseId
     */
    #recalculateCourseStats = async (courseId) => {
        const course = await this.#courseModel.findById(courseId).populate("linkedLessons");
        if (!course) return;

        const totalLessons = course.linkedLessons.length;
        const totalDuration = course.linkedLessons.reduce((sum, l) => sum + (l.duration || 0), 0);

        course.totalLessons = totalLessons;
        course.totalDuration = totalDuration;
        await course.save();
    }

    /**
     * Add a lesson ID to a course's linkedLessons
     * @param {string} courseId
     * @param {string} lessonId
     */
    addLessonToCourse = async (courseId, lessonId) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        if (!course.linkedLessons.includes(lessonId)) {
            course.linkedLessons.push(lessonId);
            await course.save();
        }

        await this.#recalculateCourseStats(courseId);

        return course;
    }

    /**
     * Remove a lesson ID from a course's linkedLessons
     * @param {string} courseId
     * @param {string} lessonId
     */
    removeLessonFromCourse = async (courseId, lessonId) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        course.linkedLessons = course.linkedLessons.filter(
            (id) => id.toString() !== lessonId
        );
        await course.save();

        await this.#recalculateCourseStats(courseId);

        return course;
    }
}

export default CourseService;