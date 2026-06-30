class LessonController {
    #lessonService

    constructor({ lessonService }) {
        this.#lessonService = lessonService;
    }

    /**
     * POST /api/v1/admin/lessons - Create a standalone lesson
     * Access: Admin/Instructor
     */
    create = async (req, res, next) => {
        try {
            const lessonData = req.body;

            const lesson = await this.#lessonService.createLesson(lessonData);

            res.status(201).json({
                status: 'success',
                data: { lesson },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/lessons - Get all lessons
     * Access: Admin
     */
    getAll = async (req, res, next) => {
        try {
            const lessons = await this.#lessonService.getLessons();

            res.status(200).json({
                status: 'success',
                data: { lessons },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/lessons/:lessonId - Get lesson by ID
     * Access: Public (if isPreview) / Authenticated (if not preview)
     */
    getById = async (req, res, next) => {
        try {
            const { lessonId } = req.params;

            const lesson = await this.#lessonService.getLessonById(lessonId);

            // If lesson is not preview, require authentication
            if (!lesson.isPreview && !req.user) {
                const error = new Error("Authentication required to access this lesson");
                error.statusCode = 401;
                throw error;
            }

            res.status(200).json({
                status: 'success',
                data: { lesson },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/admin/lessons/:lessonId - Update lesson
     * Access: Admin/Instructor
     */
    update = async (req, res, next) => {
        try {
            const { lessonId } = req.params;
            const updateData = req.body;

            const lesson = await this.#lessonService.updateLesson(lessonId, updateData);

            res.status(200).json({
                status: 'success',
                data: { lesson },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/admin/lessons/:lessonId - Delete lesson
     * Access: Admin/Instructor
     */
    delete = async (req, res, next) => {
        try {
            const { lessonId } = req.params;

            const result = await this.#lessonService.deleteLesson(lessonId);

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default LessonController;