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
            { $group: { _id: "$action", count: { $sum: 1 } } }
        ]);
        
        const outcomeStats = await this.Log.aggregate([
            { $group: { _id: "$outcome", count: { $sum: 1 } } }
        ]);

        return {
            totalLogs,
            actionStats,
            outcomeStats
        };
    }
}

export default LogRepository;
