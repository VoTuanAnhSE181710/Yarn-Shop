import mongoose from "mongoose";

export default class ConversationRepository {
    constructor({ Conversation, Message }) {
        this.Conversation = Conversation;
        this.Message = Message;
    }

    async findConversationBetweenUsers(userId1, userId2) {
        return await this.Conversation.findOne({
            participants: { 
                $all: [
                    new mongoose.Types.ObjectId(userId1), 
                    new mongoose.Types.ObjectId(userId2)
                ],
                $size: 2
            },
            isGroup: false
        }).populate('lastMessage'); 
    }

    async createConversation(userId1, userId2) {
        return await this.Conversation.create({
            participants: [userId1, userId2]
        });
    }

    async createGroupConversation(adminId, participants, name) {
        return await this.Conversation.create({
            participants,
            isGroup: true,
            name,
            admin: adminId
        });
    }

    async getUserConversations(userId) {
        return await this.Conversation.find({
            participants: { $in: [new mongoose.Types.ObjectId(userId)] }
        })
        .populate('participants', 'username avatar') // Populate participant details
        .populate('lastMessage').sort({ updatedAt: -1 }); // Sort by last updated
    }

    async updateLastMessage(conversationId, messageId) {
        return await this.Conversation.findByIdAndUpdate(
            conversationId,
            { lastMessage: messageId },
            { new: true }
        );
    }

    async getConversationById(conversationId) {
        return await this.Conversation.findById(conversationId);
    }

    async deleteConversation(conversationId) {
        return await this.Conversation.findByIdAndDelete(conversationId);
    }
}