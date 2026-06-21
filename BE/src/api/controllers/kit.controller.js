export default class KitController {
    constructor({ kitService }) {
        this.kitService = kitService;
    }

    async getAllKits(req, res, next) {
        try {
            const result = await this.kitService.getKits(req.query);
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getKitById(req, res, next) {
        try {
            const { id } = req.params;
            const kit = await this.kitService.getKitById(id);
            res.status(200).json({
                status: 'success',
                data: { kit }
            });
        } catch (error) {
            next(error);
        }
    }

    async createKit(req, res, next) {
        try {
            const kit = await this.kitService.createKit(req.body);
            res.status(201).json({
                status: 'success',
                data: { kit }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateKit(req, res, next) {
        try {
            const { id } = req.params;
            const kit = await this.kitService.updateKit(id, req.body);
            res.status(200).json({
                status: 'success',
                data: { kit }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteKit(req, res, next) {
        try {
            const { id } = req.params;
            await this.kitService.deleteKit(id);
            res.status(200).json({
                status: 'success',
                message: 'Kit deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
