export default class MessageRepository {
    constructor({ Message }) {
        this.Message = Message;
    }

    async createMessage(conversationId, senderId, content, mediaUrl = null, mediaType = 'text') {
        return await this.Message.create({
            conversationId,
            senderId,
            content,
            mediaUrl,
            mediaType
        });
    }

    async revokeMessage(messageId) {
        return await this.Message.findByIdAndUpdate(
            messageId,
            { isRevoked: true, content: "This message has been revoked", mediaUrl: null },
            { new: true }
        );
    }

    async getMessageById(messageId) {
        return await this.Message.findById(messageId);
    }

    async deleteMessagesByConversation(conversationId) {
        return await this.Message.deleteMany({ conversationId });
    }

    async getMessagesByConversation(conversationId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        return await this.Message.find({ conversationId })
            .populate('senderId', 'username avatar') // Populate sender details
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);
    }

    async markMessagesAsRead(conversationId, receiverId) {
        return await this.Message.updateMany(
            { 
                conversationId: conversationId, 
                senderId: { $ne: receiverId }, // Chỉ cập nhật tin nhắn người khác gửi
                isRead: false 
            },
            { $set: { isRead: true } }
        );
    }
}