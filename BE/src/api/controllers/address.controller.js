export default class AddressController {
    constructor({ addressService }) {
        this.addressService = addressService;
    }

    async getMyAddresses(req, res, next) {
        try {
            const userId = req.user.userId;
            const addresses = await this.addressService.getAddressesByUserId(userId);
            res.status(200).json({
                status: 'success',
                data: { addresses }
            });
        } catch (error) {
            next(error);
        }
    }

    async getAddressById(req, res, next) {
        try {
            const { id } = req.params;
            const address = await this.addressService.getAddressById(id);
            res.status(200).json({
                status: 'success',
                data: { address }
            });
        } catch (error) {
            next(error);
        }
    }

    async createAddress(req, res, next) {
        try {
            const userId = req.user.userId;
            const data = req.body;
            const address = await this.addressService.createAddress(userId, data);
            res.status(201).json({
                status: 'success',
                data: { address }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateAddress(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const data = req.body;
            const address = await this.addressService.updateAddress(id, userId, data);
            res.status(200).json({
                status: 'success',
                data: { address }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteAddress(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const result = await this.addressService.deleteAddress(id, userId);
            res.status(200).json({
                status: 'success',
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
}
