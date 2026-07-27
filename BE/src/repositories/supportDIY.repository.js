import SupportDIY from '../models/supportDIY.js';

export default class SupportDIYRepository {
    async findById(postId) {
        return SupportDIY.findById(postId).lean();
    }

    async create(data) {
        return SupportDIY.create(data);
    }

    async findAll({ filter = {}, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const posts = await SupportDIY.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const total = await SupportDIY.countDocuments(filter);

        return {
            posts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async update(postId, updateData) {
        return SupportDIY.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true }).lean();
    }

    async delete(postId) {
        return SupportDIY.findByIdAndDelete(postId);
    }
}
