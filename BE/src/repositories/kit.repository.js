import Kit from '../models/kit.js';

export default class KitRepository {
    async findById(kitId) {
        return Kit.findById(kitId).populate('productIds');
    }

    async create(data) {
        return Kit.create(data);
    }

    async findAll({ filter = {}, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const kits = await Kit.find(filter)
            .populate('productIds')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const total = await Kit.countDocuments(filter);

        return {
            kits,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async update(kitId, updateData) {
        return Kit.findByIdAndUpdate(kitId, updateData, { new: true, runValidators: true })
            .populate('productIds');
    }

    async delete(kitId) {
        return Kit.findByIdAndDelete(kitId);
    }

    async softDelete(kitId) {
        return Kit.findByIdAndUpdate(kitId, { isActive: false }, { new: true });
    }
}
