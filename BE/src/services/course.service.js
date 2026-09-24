import { Course } from "../models/Model.js";
import { NotFoundError } from "../error/error.js";

class CourseService {
    #courseModel
    #userRepository
    #logRepository
    #courseProgressRepository
    #notificationService

    constructor({ userRepository, logRepository, courseProgressRepository, notificationService }) {
        this.#courseModel = Course;
        this.#userRepository = userRepository;
        this.#logRepository = logRepository;
        this.#courseProgressRepository = courseProgressRepository;
        this.#notificationService = notificationService;
    }

    #formatCourseResponse = (course) => {
        if (!course) return null;
        
        let linkedCombo = [];
        if (course.linkedCombo && Array.isArray(course.linkedCombo)) {
            linkedCombo = course.linkedCombo.map(item => {
                if (item && item.comboId) {
                    return { comboId: item.comboId.toString() };
                }
                return { comboId: item.toString() };
            });
        } else if (course.linkedComboIds && Array.isArray(course.linkedComboIds)) {
            linkedCombo = course.linkedComboIds.map(id => ({ comboId: id.toString() }));
        }

        const formatted = {
            _id: course._id.toString(),
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            level: course.level,
            linkedLessons: course.linkedLessons || [],
            tags: course.tags || [],
            linkedCombo,
            linkedProduct: (course.linkedProduct || []).map(item => item && item._id ? item : { _id: item.toString(), ...item }),
            creatorId: course.creatorId ? course.creatorId.toString() : null,
            price: course.price || 0,
            totalDuration: course.totalDuration || 0,
            totalLessons: course.totalLessons || 0,
            averageRating: course.averageRating || 0,
            totalRatings: course.totalRatings || 0,
            enrolledCount: course.enrolledCount || 0,
            isPublished: !!course.isPublished,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        };

        return formatted;
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
        if (data) {
            delete data.totalLessons;
            delete data.totalDuration;
        }
        const course = await this.#courseModel.create(data);
        if (this.#logRepository) {
            await this.#logRepository.saveLog({
                action: "CREATE",
                targetType: "COURSE",
                outcome: "SUCCESS",
                actorId: data.creatorId,
                details: { courseId: course._id, title: course.title }
            });
        }
        
        if (course.linkedLessons && course.linkedLessons.length > 0) {
            await this.#recalculateCourseStats(course._id);
            const updatedCourse = await this.#courseModel.findById(course._id);
            return this.#formatCourseResponse(updatedCourse);
        }
        return this.#formatCourseResponse(course);
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
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .select("-__v -deletedAt")
                .lean(),
            this.#courseModel.countDocuments(query),
        ]);

        return {
            courses: courses.map(c => this.#formatCourseResponse(c)),
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
            .populate("linkedLessons")
            .select("-__v -deletedAt")
            .lean();

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        const formatted = this.#formatCourseResponse(course);
        if (course.linkedLessons && Array.isArray(course.linkedLessons)) {
            formatted.linkedLessons = course.linkedLessons.map(lesson => {
                if (lesson && typeof lesson === "object" && lesson._id) {
                    // It's populated lesson object, keep it populated but make sure it is converted safely
                    return lesson;
                }
                return lesson;
            });
        }
        return formatted;
    }

    /**
     * Update course
     * @param {string} id
     * @param {Object} updateData
     */
    updateCourse = async (id, updateData, actorId) => {
        const course = await this.#courseModel.findOne({ _id: id, deletedAt: null });

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        if (updateData) {
            delete updateData.totalLessons;
            delete updateData.totalDuration;
        }

        const oldTotalLessons = course.totalLessons || 0;
        let newLessonsAdded = false;

        Object.assign(course, updateData);
        await course.save();

        if (updateData && updateData.linkedLessons !== undefined) {
            await this.#recalculateCourseStats(id);
            if (updateData.linkedLessons.length > oldTotalLessons) {
                newLessonsAdded = true;
            }
        }

        const updatedCourse = await this.#courseModel.findOne({ _id: id, deletedAt: null });
        
        // Notify enrolled users if new lessons were added
        if (newLessonsAdded && this.#courseProgressRepository && this.#notificationService) {
            await this.#courseProgressRepository.setCourseNewContent(id);
            
            // Find all users enrolled in this course to notify them
            // The course model has enrolledCount but we need to find users who have this course in their 'enrolled' array.
            const enrolledUsers = await this.#userRepository.findUsersByEnrolledCourse(id);
            if (enrolledUsers && enrolledUsers.length > 0) {
                const notifications = enrolledUsers.map(u => ({
                    userId: u._id,
                    type: "COURSE",
                    title: "Cập nhật khóa học",
                    message: `Khóa học "${updatedCourse.title}" vừa có bài học mới! Hãy vào xem ngay.`,
                    data: { courseId: id }
                }));
                
                // Assuming notificationService has a method to create many notifications, or we loop
                for (const notif of notifications) {
                    await this.#notificationService.createNotification(notif).catch(e => console.error(e));
                }
            }
        }
        
        if (this.#logRepository) {
            await this.#logRepository.saveLog({
                action: "UPDATE",
                targetType: "COURSE",
                outcome: "SUCCESS",
                actorId,
                details: { courseId: id, title: updatedCourse.title }
            });
        }
        
        return this.#formatCourseResponse(updatedCourse);
    }

    /**
     * Delete course (soft delete)
     * @param {string} id
     */
    deleteCourse = async (id, actorId) => {
        const course = await this.#courseModel.findOne({ _id: id, deletedAt: null });

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        course.deletedAt = new Date();
        course.isPublished = false;
        await course.save();

        if (this.#logRepository) {
            await this.#logRepository.saveLog({
                action: "DELETE",
                targetType: "COURSE",
                outcome: "SUCCESS",
                actorId,
                details: { courseId: id, title: course.title }
            });
        }

        return { message: "Course deleted successfully" };
    }

    /**
     * Recalculate totalLessons and totalDuration from populated linkedLessons
     * @param {string} courseId
     */
    #recalculateCourseStats = async (courseId) => {
        const course = await this.#courseModel.findById(courseId).populate("linkedLessons");
        if (!course) return;

        const validLessons = (course.linkedLessons || []).filter(l => l != null);
        const totalLessons = validLessons.length;
        const totalDuration = validLessons.reduce((sum, l) => sum + (l.duration || 0), 0);

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
            throw new NotFoundError("Course not found");
        }

        if (!course.linkedLessons.includes(lessonId)) {
            course.linkedLessons.push(lessonId);
            await course.save();
        }

        await this.#recalculateCourseStats(courseId);

        const updatedCourse = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });
        return this.#formatCourseResponse(updatedCourse);
    }

    /**
     * Remove a lesson ID from a course's linkedLessons
     * @param {string} courseId
     * @param {string} lessonId
     */
    removeLessonFromCourse = async (courseId, lessonId) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        course.linkedLessons = course.linkedLessons.filter(
            (id) => id.toString() !== lessonId
        );
        await course.save();

        await this.#recalculateCourseStats(courseId);

        const updatedCourse = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });
        return this.#formatCourseResponse(updatedCourse);
    }

    /**
     * Enroll in a course (increment enrolledCount)
     * @param {string} courseId
     * @param {string} userId
     */
    enrollCourse = async (courseId, userId) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        const user = await this.#userRepository.findUserById({ userId });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        // Check if user already enrolled
        const enrolledArray = user.enrolled || [];
        const alreadyEnrolled = enrolledArray.some(id => id.toString() === courseId);

        if (alreadyEnrolled) {
            return {
                alreadyEnrolled: true,
                enrolledCount: course.enrolledCount || 0,
                userEnrolled: true
            };
        }

        // If course is premium, check if user has purchased it
        if (course.price > 0) {
            const purchasedArray = user.purchasedCourses || [];
            const hasPurchased = purchasedArray.some(id => id.toString() === courseId);
            if (!hasPurchased) {
                const error = new Error("Payment required to enroll in this premium course.");
                error.statusCode = 403;
                throw error;
            }
        }

        // Enroll user and increment course count
        await this.#userRepository.enrollCourse({ userId, courseId });
        course.enrolledCount = (course.enrolledCount || 0) + 1;
        await course.save();

        return {
            alreadyEnrolled: false,
            enrolledCount: course.enrolledCount,
            userEnrolled: true
        };
    }

    /**
     * Rate a course (update rating)
     * @param {string} courseId
     * @param {string} userId
     * @param {number} score
     */
    rateCourse = async (courseId, userId, score) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });

        if (!course) {
            throw new NotFoundError("Course not found");
        }

        if (score < 1 || score > 5) {
            const error = new Error("Rating score must be between 1 and 5");
            error.statusCode = 400;
            throw error;
        }

        if (!course.ratings) course.ratings = [];

        const existingRatingIndex = course.ratings.findIndex(r => r.user.toString() === userId.toString());

        if (existingRatingIndex !== -1) {
            course.ratings[existingRatingIndex].score = score;
        } else {
            course.ratings.push({ user: userId, score });
        }

        const totalScore = course.ratings.reduce((acc, curr) => acc + curr.score, 0);
        course.averageRating = Number((totalScore / course.ratings.length).toFixed(1));
        course.totalRatings = course.ratings.length;

        await course.save();

        return this.#formatCourseResponse(course);
    }

    /**
     * Mark a lesson as completed for a user
     */
    completeLesson = async (courseId, lessonId, userId) => {
        const course = await this.#courseModel.findOne({ _id: courseId, deletedAt: null });
        if (!course) throw new NotFoundError("Course not found");

        const progress = await this.#courseProgressRepository.addCompletedLesson(userId, courseId, lessonId);

        // Check if course is now fully completed
        const totalCourseLessons = course.totalLessons || 0;
        const completedCount = progress.completedLessons.length;

        if (completedCount >= totalCourseLessons && !progress.isCompleted) {
            const updatedProgress = await this.#courseProgressRepository.upsertProgress(userId, courseId, {
                isCompleted: true,
                completedAt: new Date()
            });
            
            // Notify user
            if (this.#notificationService) {
                await this.#notificationService.createNotification({
                    userId,
                    type: "COURSE",
                    title: "Chúc mừng!",
                    message: `Bạn đã hoàn thành khóa học: ${course.title}. Bằng chứng nhận của bạn đã được cấp.`,
                    data: { courseId }
                });
            }
            return updatedProgress;
        }

        return progress;
    }

    /**
     * Get course progress for a user
     */
    getCourseProgress = async (courseId, userId) => {
        const progress = await this.#courseProgressRepository.findProgress(userId, courseId);
        return progress || {
            userId,
            courseId,
            completedLessons: [],
            isCompleted: false,
            completedAt: null,
            hasNewContent: false
        };
    }
}

export default CourseService;