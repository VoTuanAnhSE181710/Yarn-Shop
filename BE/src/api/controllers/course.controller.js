class CourseController {
    #courseService

    constructor({ courseService }) {
        this.#courseService = courseService;
    }

    /**
     * POST /api/v1/admin/courses - Create a course
     * Access: Admin/Instructor
     */
    create = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const courseData = req.body;

            const course = await this.#courseService.createCourse({
                ...courseData,
                creatorId: userId,
            });

            res.status(201).json({
                status: 'success',
                data: { course },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/courses - Get courses list
     * Access: Public
     */
    getAll = async (req, res, next) => {
        try {
            const { level, tag, creatorId, page, limit, sort } = req.query;

            const result = await this.#courseService.getCourses({
                level,
                tag,
                creatorId,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                sort,
            });

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/courses/:id - Get course by ID with lessons
     * Access: Public
     */
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const course = await this.#courseService.getCourseById(id);

            res.status(200).json({
                status: 'success',
                data: { course },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/admin/courses/:id - Update course
     * Access: Admin/Instructor
     */
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const course = await this.#courseService.updateCourse(id, updateData);

            res.status(200).json({
                status: 'success',
                data: { course },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/admin/courses/:id - Delete course (soft delete)
     * Access: Admin/Instructor
     */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await this.#courseService.deleteCourse(id);

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default CourseController;