import { NotFoundError } from "../error/error.js";

export default class KitService {
    constructor({ kitRepository }) {
        this.kitRepository = kitRepository;
    }

    async getKits(query) {
        const { level, page = 1, limit = 10, isActive } = query;
        let filter = {};

        if (level) filter.level = level;
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
            throw new NotFoundError("Kit not found");
        }
        return kit;
    }

    async createKit(data) {
        return this.kitRepository.create(data);
    }

    async updateKit(id, data) {
        const kit = await this.kitRepository.update(id, data);
        if (!kit) {
            throw new NotFoundError("Kit not found");
        }
        return kit;
    }

    async deleteKit(id) {
        const kit = await this.kitRepository.softDelete(id);
        if (!kit) {
            throw new NotFoundError("Kit not found");
        }
        return kit;
    }
}
