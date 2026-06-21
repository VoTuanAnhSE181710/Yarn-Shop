export default class KitService {
    constructor({ kitRepository }) {
        this.kitRepository = kitRepository;
    }

    async getKits(query) {
        const { level, courseId, page = 1, limit = 10, isActive } = query;
        let filter = {};

        if (level) filter.level = level;
        if (courseId) filter.linkedCourseIds = courseId;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        return this.kitRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    }

    async getKitById(id) {
        const kit = await this.kitRepository.findById(id);
        if (!kit) {
            const error = new Error("Kit not found");
            error.statusCode = 404;
            throw error;
        }
        return kit;
    }

    async createKit(data) {
        return this.kitRepository.create(data);
    }

    async updateKit(id, data) {
        const kit = await this.kitRepository.update(id, data);
        if (!kit) {
            const error = new Error("Kit not found");
            error.statusCode = 404;
            throw error;
        }
        return kit;
    }

    async deleteKit(id) {
        const kit = await this.kitRepository.softDelete(id);
        if (!kit) {
            const error = new Error("Kit not found");
            error.statusCode = 404;
            throw error;
        }
        return kit;
    }
}
