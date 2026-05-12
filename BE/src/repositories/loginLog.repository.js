/**
 * Login Log Repository Class
 * Chịu trách nhiệm logging tất cả login attempts
 */

export default class LoginLogRepository {
    constructor({ LoginLogModel }) {
        this.LoginLogModel = LoginLogModel;
    }

    /**
     * Tạo log mới
     */
    async create(logData) {
        return await this.LoginLogModel.create(logData);
    }

    /**
     * Log failed login attempt
     */
    async logFailedAttempt({
        userId = null,
        identifier,
        reason,
        ipAddress = null,
        userAgent = null
    }) {
        return await this.create({
            userId,
            identifier,
            outcome: 'failure',
            reason,
            ipAddress,
            userAgent
        });
    }

    /**
     * Log successful login
     */
    async logSuccessfulLogin({
        userId,
        identifier,
        token,
        ipAddress = null,
        userAgent = null
    }) {
        return await this.create({
            userId,
            identifier,
            outcome: 'success',
            reason: null,
            tokenIssued: token ? token.substring(0, 10) : null,
            ipAddress,
            userAgent
        });
    }

    /**
     * Lấy login history của user
     */
    async findByUserId(userId, limit = 10) {
        return await this.LoginLogModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Lấy failed attempts gần đây
     */
    async getRecentFailedAttempts(identifier, hours = 1) {
        const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        return await this.LoginLogModel.find({
            identifier,
            outcome: 'failure',
            createdAt: { $gte: timeThreshold }
        }).sort({ createdAt: -1 });
    }

    /**
     * Count failed attempts trong time range
     */
    async countFailedAttempts(identifier, hours = 1) {
        const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        return await this.LoginLogModel.countDocuments({
            identifier,
            outcome: 'failure',
            createdAt: { $gte: timeThreshold }
        });
    }

    /**
     * Get login statistics
     */
    async getLoginStats(userId, days = 30) {
        const timeThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const stats = await this.LoginLogModel.aggregate([
            {
                $match: {
                    userId,
                    createdAt: { $gte: timeThreshold }
                }
            },
            {
                $group: {
                    _id: '$outcome',
                    count: { $sum: 1 }
                }
            }
        ]);

        return stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, { success: 0, failure: 0 });
    }
}
