import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content:{
        type: String,
        default: "",
    },
    mediaUrl: {
        type: String,
        default: null,
    },
    mediaType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text',
    },
    isRevoked:{
        type: Boolean,
        default: false,
    },
    isRead:{
        type: Boolean,
        default: false,
    }
}, { timestamps: true });
export default mongoose.model('Message', messageSchema);