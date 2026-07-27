import { NotFoundError, BadRequestError } from "../error/error.js";

export default class SupportDIYService {
    constructor({ supportDIYRepository }) {
        this.supportDIYRepository = supportDIYRepository;
    }

    async getPosts(query) {
        const { page = 1, limit = 10, status, creatorId, linkedComboId, linkedProductId } = query;
        let filter = {};

        if (status) filter.status = status;
        if (creatorId) filter.creatorId = creatorId;
        if (linkedComboId) filter['linkedCombo.comboId'] = linkedComboId;
        if (linkedProductId) filter['linkedProduct.productId'] = linkedProductId;

        return this.supportDIYRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    }

    async getPostById(id) {
        const post = await this.supportDIYRepository.findById(id);
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }

    async createPost(data) {
        return this.supportDIYRepository.create(data);
    }

    async updatePost(id, data) {
        const post = await this.supportDIYRepository.update(id, data);
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }

    async updateStatus(id, status) {
        const validStatuses = ["Pending", "Done", "Cancel"];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }
        const post = await this.supportDIYRepository.update(id, { status });
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }

    async deletePost(id) {
        const post = await this.supportDIYRepository.delete(id);
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }
}
