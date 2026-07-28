import { NotFoundError, BadRequestError } from "../error/error.js";
import Product from "../models/product.js";
import Kit from "../models/kit.js";

export default class KitService {
    constructor({ kitRepository }) {
        this.kitRepository = kitRepository;
    }

    /**
     * Calculate total price from products array [{productId, quantity}]
     */
    async #recalculatePrice(products) {
        if (!products || products.length === 0) return 0;
        let total = 0;
        for (const item of products) {
            const productId = item.productId?._id || item.productId;
            const product = await Product.findById(productId).lean();
            if (product && product.variants && product.variants.length > 0) {
                const price = product.variants[0].price || 0;
                total += price * (item.quantity || 1);
            }
        }
        return total;
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
        // Auto-calculate price from products
        if (data.products && data.products.length > 0) {
            data.price = await this.#recalculatePrice(data.products);
        }
        return this.kitRepository.create(data);
    }

    async updateKit(id, data) {
        // Auto-calculate price if products are being updated
        if (data.products !== undefined) {
            data.price = await this.#recalculatePrice(data.products);
        }
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

    async rateKit(kitId, userId, score) {
        const kit = await Kit.findById(kitId);
        if (!kit) throw new NotFoundError("Kit not found");

        if (score < 1 || score > 5) {
            throw new BadRequestError("Rating score must be between 1 and 5");
        }

        if (!kit.ratings) kit.ratings = [];

        const existingIndex = kit.ratings.findIndex(
            r => r.userId.toString() === userId.toString()
        );

        if (existingIndex !== -1) {
            kit.ratings[existingIndex].score = score;
        } else {
            kit.ratings.push({ userId, score });
        }

        const totalScore = kit.ratings.reduce((acc, r) => acc + r.score, 0);
        kit.averageRating = Number((totalScore / kit.ratings.length).toFixed(1));
        kit.totalRatings = kit.ratings.length;

        await kit.save();
        return kit;
    }
}
