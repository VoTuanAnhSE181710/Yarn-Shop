import { parse } from "dotenv";
import { StatusCodes } from "http-status-codes";

export default class MessageController {
    constructor({ messageService }) {
        this.messageService = messageService;
    }

    createGroupChat = async (req, res, next) => {
        try {
            const adminId = req.user?.userId;
            const { name, participantIds } = req.body;

            if (!name || !participantIds || !Array.isArray(participantIds)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'Group name and an array of participantIds are required'
                });
            }

            const group = await this.messageService.createGroupChat(adminId, participantIds, name);

            res.status(StatusCodes.CREATED).json({
                status: 'success',
                message: 'Group chat created successfully',
                data: { group }
            });
        } catch (error) {
            next(error);
        }
    }

    sendMessage = async (req, res, next) => {
        try{
            const senderId = req.user?.userId;
            const body = req.body || {};
            const { receiverId, content, mediaType } = body;
            let mediaUrl = null;

            if (!receiverId) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'receiverId is required'
                });
            }

            if (req.file) {
                mediaUrl = req.file.path; // from Cloudinary/Multer
            }

            const message = await this.messageService.sendMessage(senderId, receiverId, content, mediaUrl, mediaType);

            res.status(StatusCodes.CREATED).json({
                status: 'success',
                data: { message }
            });
        } catch (error) {
            next(error);
        }
    }

    revokeMessage = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const { messageId } = req.params;

            const revokedMessage = await this.messageService.revokeMessage(messageId, userId);

            res.status(StatusCodes.OK).json({
                status: 'success',
                message: 'Message revoked successfully',
                data: { message: revokedMessage }
            });
        } catch (error) {
            next(error);
        }
    }

    deleteConversation = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const { conversationId } = req.params;

            await this.messageService.deleteConversation(conversationId, userId);

            res.status(StatusCodes.OK).json({
                status: 'success',
                message: 'Conversation deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    getMessages = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const { conversationId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const messages = await this.messageService.getMessages(conversationId, page, limit, userId);

            res.status(StatusCodes.OK).json({
                status: 'success',
                data: { messages }
            });
        } catch (error) {
            next(error);
        }
    }

    getConversations = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const conversations = await this.messageService.getUserConversations(userId);

            return res.status(StatusCodes.OK).json({
                status: 'success',
                data: {
                    conversations
                }
            });
        } catch (error) {
            next(error);
        }
    }

    markAsRead = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const { conversationId } = req.params;

            await this.messageService.markAsRead(conversationId, userId);

            res.status(StatusCodes.OK).json({
                status: 'success',
                message: 'Messages marked as read'
            });
        } catch (error) {
            next(error);
        }
    }
}