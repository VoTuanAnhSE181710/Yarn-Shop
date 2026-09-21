import Notification from "../models/notification.js";
import { NotFoundError } from "../error/error.js";

export default class NotificationService {
    constructor({ notifications }) {
        this.notifications = notifications; // socket.io namespace
    }

    async getMyNotifications(userId, roleName, query) {
        const { page = 1, limit = 10 } = query;
        
        const filter = {
            $or: [
                { userId },
                { targetRole: roleName }
            ]
        };

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await Notification.countDocuments(filter);
        
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
                // Emit to specific user room: user_${userId}
                this.notifications.to(`user_${data.userId.toString()}`).emit("new_notification", notification);
            } else if (data.targetRole) {
                // Emit to a role room: admin or staff
                this.notifications.to(data.targetRole.toLowerCase()).emit("new_notification", notification);
            } else {
                this.notifications.emit("new_notification", notification);
            }
        }
        
        return notification;
    }

    async createNotification(data) {
        return this.createAndEmitNotification(data);
    }

    async deleteNotification(id) {
        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) {
            throw new NotFoundError("Notification not found");
        }
        return { message: "Notification deleted successfully" };
    }
}
