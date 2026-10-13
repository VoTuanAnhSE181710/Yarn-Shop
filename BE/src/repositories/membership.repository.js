import Membership from "../models/membership.js";
import MembershipHistory from "../models/membershipHistory.js";
import CoinTransaction from "../models/coinTransaction.js";
import Order from "../models/order.js";
import { RANK_CONFIGS } from "../constants/membership.constants.js";

const DUPLICATE_KEY = 11000;

// Aggregation expression computing the rank from the (already updated) `points` field,
// so rank changes are applied atomically together with the points increment.
const rankFromPointsExpr = {
    $switch: {
        branches: [...RANK_CONFIGS].reverse().map((config) => ({
            case: { $gte: ["$points", config.minPoints] },
            then: config.rank,
        })),
        default: RANK_CONFIGS[0].rank,
    },
};

export default class MembershipRepository {
    // ── Membership ──
    async findByUserId(userId) {
        return Membership.findOne({ user: userId }).lean();
    }

    /** Creates the membership doc. Returns null if it already exists (concurrent request). */
    async createIfMissing(userId) {
        try {
            const created = await Membership.create({ user: userId });
            return created.toObject();
        } catch (error) {
            if (error.code === DUPLICATE_KEY) return null;
            throw error;
        }
    }

    /** Atomically adds points (and spent amount) and recomputes rank. Returns the doc BEFORE the update. */
    async incrementPoints(userId, points, spentAmount = 0) {
        return Membership.findOneAndUpdate(
            { user: userId },
            [
                {
                    $set: {
                        points: { $max: [0, { $add: ["$points", points] }] },
                        totalSpent: { $add: ["$totalSpent", spentAmount] },
                    },
                },
                { $set: { rank: rankFromPointsExpr, updatedAt: "$$NOW" } },
            ],
            { returnDocument: "before", updatePipeline: true }
        ).lean();
    }

    async incrementCoinBalance(userId, amount) {
        return Membership.findOneAndUpdate(
            { user: userId },
            { $inc: { coinBalance: amount } },
            { returnDocument: "after" }
        ).lean();
    }

    /** Deducts coin only if the balance is sufficient. Returns null otherwise. */
    async decrementCoinBalanceIfEnough(userId, amount) {
        return Membership.findOneAndUpdate(
            { user: userId, coinBalance: { $gte: amount } },
            { $inc: { coinBalance: -amount } },
            { returnDocument: "after" }
        ).lean();
    }

    // ── History ──
    /** Inserts a history entry. Returns null if refKey was already used (idempotent). */
    async createHistory(data) {
        try {
            const entry = await MembershipHistory.create(data);
            return entry.toObject();
        } catch (error) {
            if (error.code === DUPLICATE_KEY) return null;
            throw error;
        }
    }

    /** Atomically moves an entry from one of `fromStatuses` to `toStatus`. Returns the updated entry or null. */
    async transitionHistory(userId, refKey, fromStatuses, toStatus) {
        return MembershipHistory.findOneAndUpdate(
            { user: userId, refKey, status: { $in: fromStatuses } },
            { $set: { status: toStatus } },
            { returnDocument: "after" }
        ).lean();
    }

    async updateHistory(id, data) {
        return MembershipHistory.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after" }).lean();
    }

    async findHistory(userId, { page = 1, limit = 20 } = {}) {
        const filter = { user: userId };
        const [data, total] = await Promise.all([
            MembershipHistory.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            MembershipHistory.countDocuments(filter),
        ]);
        return { data, total };
    }

    // ── Coin transactions ──
    async createCoinTransaction(data) {
        const tx = await CoinTransaction.create(data);
        return tx.toObject();
    }

    async findCoinTransactions(userId, { page = 1, limit = 20 } = {}) {
        const filter = { user: userId };
        const [data, total] = await Promise.all([
            CoinTransaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            CoinTransaction.countDocuments(filter),
        ]);
        return { data, total };
    }

    /** Earned lots that still have coin left, oldest expiry first (FIFO). */
    async findSpendableLots(userId, now = new Date()) {
        return CoinTransaction.find({
            user: userId,
            type: "earned",
            remaining: { $gt: 0 },
            expiryDate: { $gt: now },
        }).sort({ expiryDate: 1, createdAt: 1 }).lean();
    }

    async findExpiredLots(userId, now = new Date()) {
        return CoinTransaction.find({
            user: userId,
            type: "earned",
            remaining: { $gt: 0 },
            expiryDate: { $lte: now },
        }).lean();
    }

    /** Takes `amount` from a lot only if it still has that much left. Returns the updated lot or null. */
    async consumeLot(lotId, amount) {
        return CoinTransaction.findOneAndUpdate(
            { _id: lotId, remaining: { $gte: amount } },
            { $inc: { remaining: -amount } },
            { returnDocument: "after" }
        ).lean();
    }

    /** Zeroes a lot only if `remaining` is still the observed value. Returns the lot or null. */
    async expireLot(lotId, observedRemaining) {
        return CoinTransaction.findOneAndUpdate(
            { _id: lotId, remaining: observedRemaining },
            { $set: { remaining: 0 } },
            { returnDocument: "after" }
        ).lean();
    }

    // ── Order coin refund flag ──
    /** Flags the order's coin as refunded. Returns the order only for the call that flipped the flag. */
    async markOrderCoinRefunded(orderId) {
        return Order.findOneAndUpdate(
            { _id: orderId, coinUsed: { $gt: 0 }, coinRefunded: { $ne: true } },
            { $set: { coinRefunded: true } },
            { returnDocument: "after" }
        ).lean();
    }

    async unmarkOrderCoinRefunded(orderId) {
        return Order.findOneAndUpdate(
            { _id: orderId, coinUsed: { $gt: 0 }, coinRefunded: true },
            { $set: { coinRefunded: false } },
            { returnDocument: "after" }
        ).lean();
    }
}
