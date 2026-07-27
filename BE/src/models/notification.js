import mongoose from "mongoose";

const NotificationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["ORDER", "SYSTEM", "PROMOTION"],
        required: true,
    },
    priority: {
        type: String,
        enum: ["LOW", "NORMAL", "HIGH"],
        default: "NORMAL",
    },
    title: {
        type: String,
        required: true,
        default: "Notification",
    },
    message: {
        type: String,
        required: true,
        default: "New notification",
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    targetRole: {
        type: String,
        required: false
    },
    isRead: {
        type: Boolean,
        required: true,
        default: false,
    },
    readBy: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
})

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;