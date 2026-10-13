import mongoose from "mongoose";
import { RANKS } from "../constants/membership.constants.js";

// One document per user — FE `MembershipData`
const membershipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    points: { type: Number, default: 0, min: 0 },
    rank: { type: String, enum: RANKS, default: "member" },
    totalSpent: { type: Number, default: 0, min: 0 },
    coinBalance: { type: Number, default: 0, min: 0 },
}, {
    timestamps: true,
});

const Membership = mongoose.model("Membership", membershipSchema, "memberships");
export default Membership;
