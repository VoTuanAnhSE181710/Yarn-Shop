export default class MessageService {
    constructor({ messageRepository, conversationRepository, chatNamespace }) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.chatNamespace = chatNamespace;
    }

    async createGroupChat(adminId, participantIds, groupName) {
        // Ensure admin is in participants
        const uniqueParticipants = [...new Set([...participantIds, adminId].map(id => id.toString()))];  
        if (uniqueParticipants.length < 3) {
            throw new Error('Group chat must have at least 3 participants');    
        }
        
        const group = await this.conversationRepository.createGroupConversation(adminId, uniqueParticipants, groupName);
        return group;
    }

    async sendMessage(senderId, receiverId, content, mediaUrl = null, mediaType = 'text') {
        // 1. kiem tra receiverId co phai la conversationId (group hoac chat 1-1) ko
        let conversation = null;
        try {
            conversation = await this.conversationRepository.getConversationById(receiverId);
        } catch (error) {
            // Khong phai valid ObjectID cho Conversation, hoac loi khac, bo qua
        }

        if (conversation) {
            // Kiem tra sender co trong conversation khong
            const isParticipant = conversation.participants.some(p => p._id ? p._id.toString() === senderId.toString() : p.toString() === senderId.toString());
            if (!isParticipant) {
                throw new Error("You are not a participant in this conversation");
            }
        } else {
            // Neu khong tim thay conversation, coi receiverId la 1 userId -> chat 1-1
            conversation = await this.conversationRepository.findConversationBetweenUsers(senderId, receiverId);
            
            if (!conversation) {
                conversation = await this.conversationRepository.createConversation(senderId, receiverId);
            }
        }

        const conversationId = conversation._id;

        //2. luu vao DB
        const newMessage = await this.messageRepository.createMessage(conversationId, senderId, content, mediaUrl, mediaType);

        //3. cap nhat lastmess cho conversation
        await this.conversationRepository.updateLastMessage(conversationId, newMessage._id);

        //4. phat tin nhan qua socket toi nhung user dang theo doi phien chat
        
        this.chatNamespace.to(`chat_${conversationId}`).emit("receive_message", {
            _id: newMessage._id,
            conversationId: conversationId,
            senderId: senderId,
            content: content,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            isRevoked: newMessage.isRevoked,
            createdAt: newMessage.createdAt
        });
        return newMessage;
    }

    async revokeMessage(messageId, userId) {
        const message = await this.messageRepository.getMessageById(messageId);
        if (!message) throw new Error("Message not found");
        
        if (message.senderId.toString() !== userId.toString()) {
            throw new Error("You can only revoke your own messages");
        }

        const revokedMessage = await this.messageRepository.revokeMessage(messageId);

        // Emit socket event to update the UI
        this.chatNamespace.to(`chat_${message.conversationId}`).emit("message_revoked", {
            messageId: messageId,
            conversationId: message.conversationId
        });

        return revokedMessage;
    }

    async deleteConversation(conversationId, userId) {
        const conversation = await this.conversationRepository.getConversationById(conversationId);
        if (!conversation) throw new Error("Conversation not found");

        if (!conversation.participants.includes(userId)) {
            throw new Error("Not unauthorized to delete this conversation");
        }

        // Delete all messages in the conversation
        await this.messageRepository.deleteMessagesByConversation(conversationId);

        // Delete the conversation
        await this.conversationRepository.deleteConversation(conversationId);

        // Emit socket event
        this.chatNamespace.to(`chat_${conversationId}`).emit("conversation_deleted", {
            conversationId: conversationId
        });

        return { success: true };
    }

    async getMessages(conversationId, page, limit, viewerUserId = null) {
        const messages = await this.messageRepository.getMessagesByConversation(conversationId, page, limit);
        return messages;
    }

    async getUserConversations(userId) {
        return await this.conversationRepository.getUserConversations(userId);
    }

    async markAsRead(conversationId, userId) {
        // Cập nhật CSDL
        await this.messageRepository.markMessagesAsRead(conversationId, userId);

        // Báo qua socket cho người nhận biết là mình (userId) đã đọc
        this.chatNamespace.to(`chat_${conversationId}`).emit("messages_read", {
            conversationId: conversationId,
            readBy: userId,
            readAt: new Date()
        });

        return { success: true };
    }


}