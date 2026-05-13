export default class LogController {
    constructor({ logService }) {
        this.logService = logService;
    }

    async getLogs(req, res, next) {
        try {
            const { action, targetType, outcome, actorId, page, limit } = req.query;
            const filter = {};
            if (action) filter.action = action;
            if (targetType) filter.targetType = targetType;
            if (outcome) filter.outcome = outcome;
            if (actorId) filter.actorId = actorId;
            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };
            const logs = await this.logService.getLogs(filter, pagination);
            res.json(logs);
        } catch (error) {
            next(error);
        }
    }

    async getStatistics(req, res, next) {
        try {
            const result = await this.logService.getStatistics();
            res.status(200).json({
                status: 'success',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}