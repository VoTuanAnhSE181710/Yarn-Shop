import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
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
    kitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
        default: null,
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
        address: { type: String },                     // Street/detail
        provinceName: { type: String },
        districtName: { type: String },
        wardName: { type: String },
        provinceId: { type: Number },                  // Resolved by mapAddressToGHN
        districtId: { type: Number },                  // Resolved by mapAddressToGHN
        wardCode: { type: String },                    // Resolved by mapAddressToGHN
        lat: { type: Number },
        lng: { type: Number },
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
        enum: ["PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED", "PROCESSED", "REJECTED"],
        default: "PENDING",
    },
    deliveredAt: { type: Date },
    cancelReason: { type: String },
    isCancelRequested: { type: Boolean, default: false },
    cancelRequestedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema, "orders");
export default Order;