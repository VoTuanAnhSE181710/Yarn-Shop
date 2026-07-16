import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    detailAddress: {
        type: String,
        required: true
    },
    provinceId: {
        type: Number,
        required: true
    },
    provinceName: {
        type: String,
        required: true
    },
    districtId: {
        type: Number,
        required: true
    },
    districtName: {
        type: String,
        required: true
    },
    wardCode: {
        type: String,
        required: true
    },
    wardName: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Address = mongoose.model("Address", addressSchema, "addresses");
export default Address;
