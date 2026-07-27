export default class NotificationController {
    constructor({ notificationService }) {
        this.notificationService = notificationService;
    }

    async getMyNotifications(req, res, next) {
        try {
            const userId = req.user.userId;
            const query = req.query;
            const result = await this.notificationService.getMyNotifications(userId, query);
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const notification = await this.notificationService.markAsRead(id);
            res.status(200).json({
                status: 'success',
                data: { notification }
            });
        } catch (error) {
            next(error);
        }
    }
}
