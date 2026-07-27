import Notification from "../models/notification.js";
import { NotFoundError } from "../error/error.js";

export default class NotificationService {
    constructor({ notifications }) {
        this.notifications = notifications; // socket.io namespace
    }

    async getMyNotifications(userId, query) {
        const { page = 1, limit = 10 } = query;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await Notification.countDocuments({ userId });
        
        return {
            notifications,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    async markAsRead(id) {
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!notification) {
            throw new NotFoundError("Notification not found");
        }
        return notification;
    }

    async createAndEmitNotification(data) {
        // data: { type, priority, title, message, userId, targetRole }
        const notification = await Notification.create(data);
        
        // Emit via socket
        if (this.notifications) {
            if (data.userId) {
                // Emit to specific user if they are joined in a room by their userId
                this.notifications.to(data.userId.toString()).emit("new_notification", notification);
            } else if (data.targetRole) {
                // Emit to a role room
                this.notifications.to(data.targetRole).emit("new_notification", notification);
            } else {
                this.notifications.emit("new_notification", notification);
            }
        }
        
        return notification;
    }
}
