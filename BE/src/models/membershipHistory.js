import mongoose from "mongoose";
import { RANKS, HISTORY_SOURCES, HISTORY_STATUSES } from "../constants/membership.constants.js";

// Point history — FE `MembershipHistoryEntry`
const membershipHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    points: { type: Number, required: true },
    source: { type: String, enum: HISTORY_SOURCES, required: true },
    description: { type: String, required: true },
    // Reference of what produced the entry: order id, DIY post id, course id...
    orderId: { type: String, default: null },
    orderAmount: { type: Number, default: null },
    newRank: { type: String, enum: [...RANKS, null], default: null },
    status: { type: String, enum: HISTORY_STATUSES, default: "completed" },
    // BE-only idempotency key, e.g. "order:<id>", "diy:<id>", "registration"
    refKey: { type: String, default: null },
}, {
    timestamps: true,
});

membershipHistorySchema.index({ user: 1, createdAt: -1 });
// A given order / post / course / signup can only reward a user once
membershipHistorySchema.index(
    { user: 1, refKey: 1 },
    { unique: true, partialFilterExpression: { refKey: { $type: "string" } } }
);

const MembershipHistory = mongoose.model("MembershipHistory", membershipHistorySchema, "membershipHistories");
export default MembershipHistory;
