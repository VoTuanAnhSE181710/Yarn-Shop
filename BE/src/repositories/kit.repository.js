import Kit from '../models/kit.js';

export default class KitRepository {
    _filterVariants(kit) {
        if (!kit || !kit.products) return kit;
        kit.products.forEach(p => {
            if (p.variantId && p.productId && Array.isArray(p.productId.variants)) {
                p.productId.variants = p.productId.variants.filter(
                    v => v._id && v._id.toString() === p.variantId.toString()
                );
            }
        });
        return kit;
    }

    async findById(kitId) {
        const kit = await Kit.findById(kitId).populate('products.productId').lean();
        return this._filterVariants(kit);
    }

    async create(data) {
        return Kit.create(data);
    }

    async findAll({ filter = {}, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const kits = await Kit.find(filter)
            .populate('products.productId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        kits.forEach(k => this._filterVariants(k));

        const total = await Kit.countDocuments(filter);

        return {
            kits,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async update(kitId, updateData) {
        const kit = await Kit.findByIdAndUpdate(kitId, updateData, { new: true, runValidators: true })
            .populate('products.productId')
            .lean();
        return this._filterVariants(kit);
    }

    async delete(kitId) {
        return Kit.findByIdAndDelete(kitId);
    }
    
    async softDelete(kitId) {
        return Kit.findByIdAndUpdate(kitId, { isActive: false }, { new: true });
    }
}
