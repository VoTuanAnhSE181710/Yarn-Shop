import mongoose from "mongoose";

const orderReportSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: [true, "Title is required!"],
        trim: true,
        minlength: [5, "Title must be at least 5 characters"],
    },
    description: {
        type: String,
        required: [true, "Description is required!"],
        trim: true,
        minlength: [10, "Description must be at least 10 characters"],
    },
    images: [{
        type: String,
    }],
    status: {
        type: String,
        enum: ["PENDING", "DONE", "CANCELLED"],
        default: "PENDING",
    },
    adminNote: {
        type: String,
        default: "",
    },
    assignedStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, {
    timestamps: true,
});

const OrderReport = mongoose.model("OrderReport", orderReportSchema, "orderreports");
export default OrderReport;