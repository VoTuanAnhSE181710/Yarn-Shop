const parsePaging = (query) => ({
    page: Math.max(1, parseInt(query.page) || 1),
    limit: Math.min(50, Math.max(1, parseInt(query.limit) || 20)),
});

export default class MembershipController {
    constructor({ membershipService }) {
        this.membershipService = membershipService;
    }

    getConfig = async (req, res, next) => {
        try {
            res.status(200).json({
                status: 'success',
                data: this.membershipService.getConfig(),
            });
        } catch (error) {
            next(error);
        }
    };

    getMyMembership = async (req, res, next) => {
        try {
            const { limit } = parsePaging(req.query);
            const data = await this.membershipService.getMyMembership(req.user.userId, { limit });
            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getMyHistory = async (req, res, next) => {
        try {
            const data = await this.membershipService.getMyHistory(req.user.userId, parsePaging(req.query));
            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getMyCoinTransactions = async (req, res, next) => {
        try {
            const data = await this.membershipService.getMyCoinTransactions(req.user.userId, parsePaging(req.query));
            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };
}
