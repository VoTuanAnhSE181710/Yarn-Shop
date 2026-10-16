// ============================================================
// Membership & Coin rules — mirrors FE `features/membership/types/membership.types.ts`
// (RANK_CONFIGS, COIN_RULES, getRankFromPoints) and the amounts in `membership.mock.ts`.
// Keep both sides in sync; FE can read these via GET /membership/config.
// ============================================================

export const RANKS = ["member", "silver", "gold", "diamond"];

// Sorted ascending by minPoints.
export const RANK_CONFIGS = [
    { rank: "member", displayName: "Member", minPoints: 0, coinRewardPercent: 3 },
    { rank: "silver", displayName: "Silver", minPoints: 1000, coinRewardPercent: 4 },
    { rank: "gold", displayName: "Gold", minPoints: 3000, coinRewardPercent: 5 },
    { rank: "diamond", displayName: "Diamond", minPoints: 8000, coinRewardPercent: 6 },
];

export const COIN_RULES = {
    exchangeRate: 1,          // 1 coin = 1₫
    maxUsagePercent: 20,      // max 20% of the order subtotal
    minOrderForCoin: 100000,  // subtotal must be >= 100.000₫ to use coin
    expiryMonths: 6,          // earned coin expires after 6 months
};

// Points & bonuses (amounts taken from FE mock data)
export const POINT_RULES = {
    vndPerPoint: 1000,             // 507.000₫ order -> 507 points
    registrationPoints: 500,      // "Thưởng đăng ký tài khoản"
    registrationCoins: 500,       // "Thưởng đăng ký tài khoản mới"
    diyPostPoints: 500,            // "Đăng bài DIY"
    diyPostCoins: 500,             // "Thưởng đăng video DIY"
    courseCompletePoints: 200,     // FE has no amount yet — BE default
};

export const HISTORY_SOURCES = ["purchase", "diy_video", "registration", "rank_up", "course_complete"];
export const HISTORY_STATUSES = ["completed", "pending", "cancelled"];
export const COIN_TX_TYPES = ["earned", "used", "expired"];

export function getRankFromPoints(points) {
    let current = RANK_CONFIGS[0].rank;
    for (const config of RANK_CONFIGS) {
        if (points >= config.minPoints) current = config.rank;
    }
    return current;
}

export function getRankConfig(rank) {
    return RANK_CONFIGS.find((r) => r.rank === rank) ?? RANK_CONFIGS[0];
}

export function pointsForAmount(amount) {
    return Math.max(0, Math.floor((amount || 0) / POINT_RULES.vndPerPoint));
}

export function coinRewardForAmount(amount, rank) {
    return Math.max(0, Math.floor((amount || 0) * getRankConfig(rank).coinRewardPercent / 100));
}

export function maxCoinUsage(subtotal) {
    if ((subtotal || 0) < COIN_RULES.minOrderForCoin) return 0;
    return Math.floor(subtotal * COIN_RULES.maxUsagePercent / 100);
}
