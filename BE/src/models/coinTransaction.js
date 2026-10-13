import mongoose from "mongoose";
import { COIN_TX_TYPES } from "../constants/membership.constants.js";

// Coin ledger — FE `CoinTransaction`
const coinTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Signed: positive for "earned", negative for "used" / "expired"
    amount: { type: Number, required: true },
    type: { type: String, enum: COIN_TX_TYPES, required: true },
    description: { type: String, required: true },
    orderId: { type: String, default: null },
    expiryDate: { type: Date, default: null },
    // BE-only: unspent part of an "earned" lot, consumed FIFO by expiry date
    remaining: { type: Number, default: 0, min: 0 },
}, {
    timestamps: true,
});

coinTransactionSchema.index({ user: 1, createdAt: -1 });
coinTransactionSchema.index({ user: 1, type: 1, remaining: 1, expiryDate: 1 });

const CoinTransaction = mongoose.model("CoinTransaction", coinTransactionSchema, "coinTransactions");
export default CoinTransaction;
