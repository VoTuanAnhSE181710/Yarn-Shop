import { BadRequestError } from "../error/error.js";
import {
    RANK_CONFIGS,
    COIN_RULES,
    POINT_RULES,
    getRankFromPoints,
    getRankConfig,
    pointsForAmount,
    coinRewardForAmount,
    maxCoinUsage,
} from "../constants/membership.constants.js";

const MAX_LOT_RETRIES = 5;

const toId = (value) => (value?._id ? value._id.toString() : value?.toString());
const shortOrderId = (orderId) => `#${toId(orderId).slice(-8).toUpperCase()}`;

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

// ── Response mappers: shapes match FE membership.types.ts ──
function toMembershipData(doc) {
    return {
        userId: toId(doc.user),
        points: doc.points,
        rank: doc.rank,
        totalSpent: doc.totalSpent,
        coinBalance: doc.coinBalance,
        updatedAt: doc.updatedAt,
    };
}

function toHistoryEntry(doc) {
    return {
        id: toId(doc._id),
        date: doc.createdAt,
        points: doc.points,
        source: doc.source,
        description: doc.description,
        ...(doc.orderId ? { orderId: doc.orderId } : {}),
        ...(doc.orderAmount != null ? { orderAmount: doc.orderAmount } : {}),
        ...(doc.newRank ? { newRank: doc.newRank } : {}),
        status: doc.status,
    };
}

function toCoinTransaction(doc) {
    return {
        id: toId(doc._id),
        date: doc.createdAt,
        amount: doc.amount,
        type: doc.type,
        description: doc.description,
        ...(doc.orderId ? { orderId: doc.orderId } : {}),
        ...(doc.expiryDate ? { expiryDate: doc.expiryDate } : {}),
    };
}

export default class MembershipService {
    constructor({ membershipRepository }) {
        this.membershipRepository = membershipRepository;
    }

    // ============================================================
    // Read APIs
    // ============================================================

    getConfig() {
        return { ranks: RANK_CONFIGS, coinRules: COIN_RULES, pointRules: POINT_RULES };
    }

    /** Overview for FE store `initialize()`: membership + latest history + latest coin transactions. */
    async getMyMembership(userId, { limit = 20 } = {}) {
        const membership = await this.ensureMembership(userId);
        const [history, coins] = await Promise.all([
            this.membershipRepository.findHistory(userId, { page: 1, limit }),
            this.membershipRepository.findCoinTransactions(userId, { page: 1, limit }),
        ]);
        return {
            membership: toMembershipData(membership),
            history: history.data.map(toHistoryEntry),
            coinTransactions: coins.data.map(toCoinTransaction),
        };
    }

    async getMyHistory(userId, { page = 1, limit = 20 } = {}) {
        await this.ensureMembership(userId);
        const { data, total } = await this.membershipRepository.findHistory(userId, { page, limit });
        return { history: data.map(toHistoryEntry), pagination: { page, limit, total } };
    }

    async getMyCoinTransactions(userId, { page = 1, limit = 20 } = {}) {
        await this.ensureMembership(userId);
        const { data, total } = await this.membershipRepository.findCoinTransactions(userId, { page, limit });
        return { coinTransactions: data.map(toCoinTransaction), pagination: { page, limit, total } };
    }

    /**
     * Returns the user's membership, creating it (with the signup bonus) on first access,
     * and expiring coin lots that are past their expiry date.
     */
    async ensureMembership(userId) {
        let membership = await this.membershipRepository.findByUserId(userId);
        if (!membership) {
            const created = await this.membershipRepository.createIfMissing(userId);
            if (created) {
                await this.#awardBonus(userId, {
                    refKey: "registration",
                    source: "registration",
                    points: POINT_RULES.registrationPoints,
                    coins: POINT_RULES.registrationCoins,
                    description: "Thưởng đăng ký tài khoản",
                    coinDescription: "Thưởng đăng ký tài khoản mới",
                });
            }
        }
        await this.expireCoins(userId);
        return this.membershipRepository.findByUserId(userId);
    }

    // ============================================================
    // Coin ledger
    // ============================================================

    async addCoins(userId, amount, description, orderId = null) {
        if (!amount || amount <= 0) return null;
        const now = new Date();
        const tx = await this.membershipRepository.createCoinTransaction({
            user: userId,
            amount,
            type: "earned",
            description,
            orderId: orderId ? toId(orderId) : null,
            expiryDate: addMonths(now, COIN_RULES.expiryMonths),
            remaining: amount,
        });
        await this.membershipRepository.incrementCoinBalance(userId, amount);
        return tx;
    }

    /** Deducts coin from the balance and consumes earned lots FIFO by expiry date. */
    async spendCoins(userId, amount, description, orderId = null) {
        await this.ensureMembership(userId);
        const updated = await this.membershipRepository.decrementCoinBalanceIfEnough(userId, amount);
        if (!updated) {
            throw new BadRequestError("Số dư coin không đủ");
        }

        let left = amount;
        for (let attempt = 0; left > 0 && attempt < MAX_LOT_RETRIES; attempt++) {
            const lots = await this.membershipRepository.findSpendableLots(userId);
            if (lots.length === 0) break;
            for (const lot of lots) {
                if (left <= 0) break;
                const take = Math.min(lot.remaining, left);
                const consumed = await this.membershipRepository.consumeLot(lot._id, take);
                if (consumed) left -= take;
            }
        }
        if (left > 0) {
            // Balance and lots disagree (legacy data) — the balance is the source of truth.
            console.warn(`[Membership] ${left} coin spent by user ${userId} not backed by earned lots`);
        }

        return this.membershipRepository.createCoinTransaction({
            user: userId,
            amount: -amount,
            type: "used",
            description,
            orderId: orderId ? toId(orderId) : null,
        });
    }

    /** Turns past-due earned lots into "expired" transactions and removes them from the balance. */
    async expireCoins(userId) {
        const lots = await this.membershipRepository.findExpiredLots(userId);
        for (const lot of lots) {
            const expired = await this.membershipRepository.expireLot(lot._id, lot.remaining);
            if (!expired) continue; // spent or expired concurrently
            await this.membershipRepository.createCoinTransaction({
                user: userId,
                amount: -lot.remaining,
                type: "expired",
                description: `Coin hết hạn (nhận ngày ${new Date(lot.createdAt).toLocaleDateString("vi-VN")})`,
                orderId: lot.orderId,
            });
            await this.membershipRepository.incrementCoinBalance(userId, -lot.remaining);
        }
    }

    // ============================================================
    // Checkout: coin redemption
    // ============================================================

    /** Validates a coin redemption against COIN_RULES and the user's balance. */
    async validateCoinUsage(userId, coinUsed, subtotal) {
        if (!Number.isInteger(coinUsed) || coinUsed <= 0) {
            throw new BadRequestError("coinUsed phải là số nguyên dương");
        }
        if (subtotal < COIN_RULES.minOrderForCoin) {
            throw new BadRequestError(`Đơn hàng phải từ ${COIN_RULES.minOrderForCoin.toLocaleString("vi-VN")}₫ để dùng coin`);
        }
        const max = maxCoinUsage(subtotal);
        if (coinUsed > max) {
            throw new BadRequestError(`Chỉ được dùng tối đa ${max.toLocaleString("vi-VN")} coin (${COIN_RULES.maxUsagePercent}% giá trị đơn)`);
        }
        const membership = await this.ensureMembership(userId);
        if (membership.coinBalance < coinUsed) {
            throw new BadRequestError("Số dư coin không đủ");
        }
        return coinUsed * COIN_RULES.exchangeRate;
    }

    async redeemCoinsForOrder(userId, orderId, coinUsed) {
        return this.spendCoins(userId, coinUsed, `Dùng coin cho đơn hàng ${shortOrderId(orderId)}`, orderId);
    }

    /** Returns coinUsed of a cancelled/rejected order. Safe to call multiple times. */
    async refundOrderCoins(order) {
        if (!order?.coinUsed) return null;
        const flagged = await this.membershipRepository.markOrderCoinRefunded(order._id);
        if (!flagged) return null;
        return this.addCoins(
            toId(order.user),
            order.coinUsed,
            `Hoàn coin từ đơn hàng đã huỷ ${shortOrderId(order._id)}`,
            order._id
        );
    }

    // ============================================================
    // Order lifecycle: pending -> completed (DELIVERED) | cancelled
    // ============================================================

    /** Called when an order is created: shows the points to be earned as "pending". */
    async recordPendingPurchase(order) {
        const userId = toId(order.user);
        await this.ensureMembership(userId);
        return this.membershipRepository.createHistory({
            user: userId,
            points: pointsForAmount(order.itemsPrice),
            source: "purchase",
            description: `Mua hàng - đơn ${shortOrderId(order._id)}`,
            orderId: toId(order._id),
            orderAmount: order.itemsPrice,
            status: "pending",
            refKey: `order:${toId(order._id)}`,
        });
    }

    /** Called when an order is DELIVERED: grants points, totalSpent, rank and coin reward. */
    async completePurchase(order) {
        const userId = toId(order.user);
        const orderId = toId(order._id);
        const refKey = `order:${orderId}`;
        await this.ensureMembership(userId);

        let entry = await this.membershipRepository.transitionHistory(userId, refKey, ["pending", "cancelled"], "completed");
        if (!entry) {
            // Orders created before membership existed have no pending entry yet
            entry = await this.membershipRepository.createHistory({
                user: userId,
                points: pointsForAmount(order.itemsPrice),
                source: "purchase",
                description: `Mua hàng - đơn ${shortOrderId(orderId)}`,
                orderId,
                orderAmount: order.itemsPrice,
                status: "completed",
                refKey,
            });
            if (!entry) return null; // already completed
        }

        const before = await this.membershipRepository.incrementPoints(userId, entry.points, entry.orderAmount || 0);
        const oldRank = before.rank;
        const newRank = getRankFromPoints(before.points + entry.points);
        if (newRank !== oldRank) {
            await this.membershipRepository.updateHistory(entry._id, { newRank });
        }

        // Coin reward uses the rank held when the order completes (same as FE calculateCoinEarn)
        const percent = getRankConfig(oldRank).coinRewardPercent;
        await this.addCoins(
            userId,
            coinRewardForAmount(entry.orderAmount, oldRank),
            `${percent}% từ đơn hàng ${shortOrderId(orderId)}`,
            orderId
        );
        return { entry, oldRank, newRank };
    }

    /** Called when an order is CANCELLED / REJECTED: cancels pending points and refunds used coin. */
    async cancelPurchase(order) {
        const userId = toId(order.user);
        await this.membershipRepository.transitionHistory(userId, `order:${toId(order._id)}`, ["pending"], "cancelled");
        await this.refundOrderCoins(order);
    }

    /** Called when a cancelled order is retried for payment: re-opens points and re-spends refunded coin. */
    async reopenPurchase(order) {
        const userId = toId(order.user);
        if (order.coinUsed > 0 && order.coinRefunded) {
            await this.spendCoins(userId, order.coinUsed, `Dùng lại coin cho đơn hàng ${shortOrderId(order._id)}`, order._id);
            await this.membershipRepository.unmarkOrderCoinRefunded(order._id);
        }
        await this.membershipRepository.transitionHistory(userId, `order:${toId(order._id)}`, ["cancelled"], "pending");
    }

    // ============================================================
    // Other rewards
    // ============================================================

    async rewardDiyPost(userId, post) {
        await this.ensureMembership(toId(userId));
        return this.#awardBonus(toId(userId), {
            refKey: `diy:${toId(post._id)}`,
            source: "diy_video",
            points: POINT_RULES.diyPostPoints,
            coins: POINT_RULES.diyPostCoins,
            description: `Đăng bài DIY: ${post.title}`,
            coinDescription: "Thưởng đăng video DIY",
            orderId: toId(post._id),
        });
    }

    async rewardCourseComplete(userId, course) {
        await this.ensureMembership(toId(userId));
        return this.#awardBonus(toId(userId), {
            refKey: `course:${toId(course._id)}`,
            source: "course_complete",
            points: POINT_RULES.courseCompletePoints,
            coins: 0,
            description: `Hoàn thành khóa học: ${course.title}`,
            orderId: toId(course._id),
        });
    }

    /** Grants a one-off bonus (idempotent by refKey). */
    async #awardBonus(userId, { refKey, source, points, coins, description, coinDescription, orderId = null }) {
        const entry = await this.membershipRepository.createHistory({
            user: userId,
            points,
            source,
            description,
            orderId,
            status: "completed",
            refKey,
        });
        if (!entry) return null; // already rewarded

        const before = await this.membershipRepository.incrementPoints(userId, points);
        if (before) {
            const newRank = getRankFromPoints(before.points + points);
            if (newRank !== before.rank) {
                await this.membershipRepository.updateHistory(entry._id, { newRank });
            }
        }
        if (coins > 0) {
            await this.addCoins(userId, coins, coinDescription || description, orderId);
        }
        return entry;
    }
}
