import mongoose from "mongoose";

const refundInvoiceSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    reason: {
        type: String,
        default: "Order cancelled by user"
    },
    status: {
        type: String,
        enum: ["PENDING", "PROCESSED", "REJECTED"],
        default: "PENDING",
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    processedAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

const RefundInvoice = mongoose.model("RefundInvoice", refundInvoiceSchema);
export default RefundInvoice;
