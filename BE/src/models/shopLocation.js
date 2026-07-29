import mongoose from "mongoose";

const deliveryPolicySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    maxDistanceKm: { type: Number, min: 0, default: 100 },
    baseDistanceKm: { type: Number, min: 0, default: 5 },
    baseFee: { type: Number, min: 0, default: 15000 },
    feePerKm: { type: Number, min: 0, default: 2500 },
    minFee: { type: Number, min: 0, default: 15000 },
    maxFee: { type: Number, min: 0, default: 150000 },
    freeShippingThreshold: { type: Number, min: 0, default: 500000 },
  },
  { _id: false },
);

const shopLocationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "primary",
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      default: "Yarn Shop Vĩnh Kim",
    },
    address: {
      type: String,
      trim: true,
      required: true,
    },
    communeName: {
      type: String,
      trim: true,
      default: "Xã Vĩnh Kim",
    },
    provinceName: {
      type: String,
      trim: true,
      default: "Tỉnh Đồng Tháp",
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryPolicy: {
      type: deliveryPolicySchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

const ShopLocation = mongoose.model(
  "ShopLocation",
  shopLocationSchema,
  "shop_locations",
);

export default ShopLocation;
