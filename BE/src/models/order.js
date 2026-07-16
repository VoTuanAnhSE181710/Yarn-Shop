import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    variant: {
        color: { type: String },
        hexCode: { type: String },
    },
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        provinceId: { type: Number },
        districtId: { type: Number },
        wardCode: { type: String },
    },
    itemsPrice: {
        type: Number,
        required: true,
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    payment: {
        method: {
            type: String,
            enum: ["COD", "VNPAY"],
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
            default: "PENDING",
        },
        transactionNo: { type: String },
        paidAt: { type: Date },
    },
    orderStatus: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED"],
        default: "PENDING",
    },
    deliveredAt: { type: Date },
    cancelReason: { type: String },
}, {
    timestamps: true,
});

const Order = mongoose.model("Order", orderSchema, "orders");
export default Order;