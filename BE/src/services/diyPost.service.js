import { NotFoundError, BadRequestError } from "../error/error.js";

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
            throw new NotFoundError("DIY Post not found");
        }
        return post;
    }

    async createPost(data) {
        return this.diyPostRepository.create(data);
    }

    async updatePost(id, data) {
        const post = await this.diyPostRepository.update(id, data);
        if (!post) {
            throw new NotFoundError("DIY Post not found");
        }
        return post;
    }

    async updateStatus(id, status) {
        const validStatuses = ["Pending", "Done", "Cancel"];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }
        const post = await this.diyPostRepository.update(id, { status });
        if (!post) {
            throw new NotFoundError("DIY Post not found");
        }
        return post;
    }

    async deletePost(id) {
        const post = await this.diyPostRepository.delete(id);
        if (!post) {
            throw new NotFoundError("DIY Post not found");
        }
        return post;
    }

    async ratePost(id, userId, score) {
        const post = await this.diyPostRepository.findById(id);
        if (!post) {
            throw new NotFoundError("DIY Post not found");
        }

        if (score < 1 || score > 5) {
            throw new BadRequestError("Rating score must be between 1 and 5");
        }

        const ratings = post.ratings || [];
        const existingRatingIndex = ratings.findIndex(r => r.userId.toString() === userId.toString());

        if (existingRatingIndex !== -1) {
            ratings[existingRatingIndex].score = score;
        } else {
            ratings.push({ userId, score });
        }

        const totalScore = ratings.reduce((acc, curr) => acc + curr.score, 0);
        const averageRating = Number((totalScore / ratings.length).toFixed(1));
        const totalRatings = ratings.length;

        const updatedPost = await this.diyPostRepository.update(id, { ratings, averageRating, totalRatings });
        return updatedPost;
    }
}
