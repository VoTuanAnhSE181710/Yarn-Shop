import DIYPost from '../models/diyPost.js';

export default class DIYPostRepository {
    async findById(postId) {
        return DIYPost.findById(postId).lean();
    }

    async create(data) {
        return DIYPost.create(data);
    }

    async findAll({ filter = {}, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const posts = await DIYPost.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const total = await DIYPost.countDocuments(filter);

        return {
            posts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async update(postId, updateData) {
        return DIYPost.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true }).lean();
    }

    async delete(postId) {
        return DIYPost.findByIdAndDelete(postId);
    }
}
