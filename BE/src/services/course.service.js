import { Course, Lesson } from "../models/Model.js";

class CourseService {
    #courseModel
    #lessonModel

    constructor() {
        this.#courseModel = Course;
        this.#lessonModel = Lesson;
    }

    /**
     * Create a new course
     * @param {Object} data - Course data
     * @param {string} data.title
     * @param {string} data.description
     * @param {string} data.thumbnail
     * @param {"beginner"|"intermediate"|"advanced"} data.level
     * @param {string[]} data.tags
     * @param {string} data.creatorId - User ObjectId
     * @param {string[]} data.linkedComboIds
     * @param {boolean} data.isPublished
     */
    createCourse = async (data) => {
        const course = await this.#courseModel.create(data);
        return course;
    }

    /**
     * Get courses list with filtering, pagination, sorting
     * @param {Object} param
     * @param {"beginner"|"intermediate"|"advanced"} [param.level]
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
     * Get course by ID with lessons
     * @param {string} id
     */
    getCourseById = async (id) => {
        const course = await this.#courseModel.findOne({ _id: id, deletedAt: null })
            .populate("creatorId", "username fullName avatar")
            .lean();

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        const lessons = await this.#lessonModel.find({ courseId: id })
            .sort({ order: 1 })
            .lean();

        return { ...course, lessons };
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
}

export default CourseService;