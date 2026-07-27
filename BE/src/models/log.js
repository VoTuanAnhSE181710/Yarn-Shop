import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            enum: ["REGISTER", "LOGIN", "UPDATE", "DELETE", "CREATE", "GET", "RECEIVE_INVENTORY"],
        },
        targetType: {
            type: String,
            required: true,
            enum: ["USER", "WAREHOUSE", "ROLE", "PERMISSION", "INVENTORY", "ORDER", "PRODUCT", "COURSE", "DIYPOST"],
        },
        outcome: {
            type: String,
            required: true,
            enum: ["SUCCESS", "FAILED"],
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        details: {
            type: Object,
            default: {},
        },
        timestamps: {
            type: Date,
            default: Date.now,
        },
    }
);

const Log = mongoose.model("Log", logSchema);
export default Log;
