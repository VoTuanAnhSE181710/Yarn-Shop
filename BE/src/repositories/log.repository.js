class LogRepository {
    constructor({ Log }) {
        this.Log = Log;
    }

    async saveLog({
        action,
        targetType,
        outcome,
        actorId = null,
        details = {},
    }) {
        try {
            return await this.Log.create({
                action,
                targetType,
                outcome,
                actorId,
                details
            });
        } catch (error) {
            console.error("Failed to save log:", error);
            // Don't throw error to prevent interrupting the main flow
            return null;
        }
    }

    async getLogs(filter, pagination) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const logs = await this.Log.find(filter)
            .populate("actorId", "fullName email roleName")
            .sort({ timestamps: -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.Log.countDocuments(filter);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getStatistics() {
        const totalLogs = await this.Log.countDocuments();
        
        const actionStats = await this.Log.aggregate([
            { $group: { _id: "$action", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        const outcomeStats = await this.Log.aggregate([
            { $group: { _id: "$outcome", count: { $sum: 1 } } }
        ]);

        const targetTypeStats = await this.Log.aggregate([
            { $group: { _id: "$targetType", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const topUsersStats = await this.Log.aggregate([
            { $match: { actorId: { $ne: null } } },
            { $group: { _id: "$actorId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { 
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    fullName: "$user.fullName",
                    email: "$user.email"
                }
            }
        ]);

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        const timelineStats = await this.Log.aggregate([
            {
                $facet: {
                    "1h": [
                        { $match: { timestamps: { $gte: oneHourAgo } } },
                        { $group: { _id: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$timestamps" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    "6h": [
                        { $match: { timestamps: { $gte: sixHoursAgo } } },
                        { $group: { _id: { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamps" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    "1d": [
                        { $match: { timestamps: { $gte: oneDayAgo } } },
                        { $group: { _id: { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamps" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    "7d": [
                        { $match: { timestamps: { $gte: sevenDaysAgo } } },
                        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamps" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    "30d": [
                        { $match: { timestamps: { $gte: thirtyDaysAgo } } },
                        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamps" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    "1y": [
                        { $match: { timestamps: { $gte: oneYearAgo } } },
                        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$timestamps" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        return {
            totalLogs,
            actionStats,
            outcomeStats,
            targetTypeStats,
            topUsersStats,
            timelineStats: timelineStats[0]
        };
    }
}

export default LogRepository;
