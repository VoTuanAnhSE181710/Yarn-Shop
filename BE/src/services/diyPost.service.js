export default class DIYPostService {
    constructor({ diyPostRepository }) {
        this.diyPostRepository = diyPostRepository;
    }

    async getPosts(query) {
        const { page = 1, limit = 10, status, creatorId, linkedComboId, linkedProductId } = query;
        let filter = {};

        if (status) filter.status = status;
        if (creatorId) filter.creatorId = creatorId;
        if (linkedComboId) filter['linkedCombo.comboId'] = linkedComboId;
        if (linkedProductId) filter['linkedProduct.productId'] = linkedProductId;

        return this.diyPostRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    }

    async getPostById(id) {
        const post = await this.diyPostRepository.findById(id);
        if (!post) {
            const error = new Error("DIY Post not found");
            error.statusCode = 404;
            throw error;
        }
        return post;
    }

    async createPost(data) {
        return this.diyPostRepository.create(data);
    }

    async updatePost(id, data) {
        const post = await this.diyPostRepository.update(id, data);
        if (!post) {
            const error = new Error("DIY Post not found");
            error.statusCode = 404;
            throw error;
        }
        return post;
    }

    async deletePost(id) {
        const post = await this.diyPostRepository.delete(id);
        if (!post) {
            const error = new Error("DIY Post not found");
            error.statusCode = 404;
            throw error;
        }
        return post;
    }
}
