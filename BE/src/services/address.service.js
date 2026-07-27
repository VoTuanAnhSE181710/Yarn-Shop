import { NotFoundError, BadRequestError } from "../error/error.js";

export default class AddressService {
    constructor({ addressRepository }) {
        this.addressRepository = addressRepository;
    }

    async getAddressesByUserId(userId) {
        return this.addressRepository.findByUserId(userId);
    }

    async getAddressById(id) {
        const address = await this.addressRepository.findById(id);
        if (!address) {
            throw new NotFoundError("Address not found");
        }
        return address;
    }

    async createAddress(userId, data) {
        data.user = userId;
        
        // If this is the first address or explicitly set to default
        if (data.isDefault) {
            await this.addressRepository.unsetDefaultByUserId(userId);
        } else {
            const userAddresses = await this.addressRepository.findByUserId(userId);
            if (userAddresses.length === 0) {
                data.isDefault = true;
            }
        }

        return this.addressRepository.create(data);
    }

    async updateAddress(id, userId, data) {
        const existingAddress = await this.addressRepository.findById(id);
        if (!existingAddress) {
            throw new NotFoundError("Address not found");
        }

        if (existingAddress.user.toString() !== userId.toString()) {
            throw new BadRequestError("Not authorized to update this address");
        }

        if (data.isDefault) {
            await this.addressRepository.unsetDefaultByUserId(userId);
        } else if (existingAddress.isDefault && !data.isDefault) {
            // Cannot unset the default address without setting another one, 
            // but we'll allow it if there's no complex requirement.
            // For safety, let's keep it default if they try to unset their only default address.
            const userAddresses = await this.addressRepository.findByUserId(userId);
            if (userAddresses.length <= 1) {
                data.isDefault = true;
            }
        }

        return this.addressRepository.update(id, data);
    }

    async deleteAddress(id, userId) {
        const address = await this.addressRepository.findById(id);
        if (!address) {
            throw new NotFoundError("Address not found");
        }
        if (address.user.toString() !== userId.toString()) {
            throw new BadRequestError("Not authorized to delete this address");
        }

        await this.addressRepository.delete(id);

        if (address.isDefault) {
            const remainingAddresses = await this.addressRepository.findByUserId(userId);
            if (remainingAddresses.length > 0) {
                await this.addressRepository.update(remainingAddresses[0]._id, { isDefault: true });
            }
        }

        return { message: "Address deleted successfully" };
    }
}
