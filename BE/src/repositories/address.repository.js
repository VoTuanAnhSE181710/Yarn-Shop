import Address from '../models/address.js';

export default class AddressRepository {
    async findById(id) {
        return Address.findById(id).lean();
    }

    async findByUserId(userId) {
        return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    }

    async create(data) {
        return Address.create(data);
    }

    async update(id, updateData) {
        return Address.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
    }

    async delete(id) {
        return Address.findByIdAndDelete(id);
    }

    async unsetDefaultByUserId(userId) {
        return Address.updateMany({ user: userId }, { isDefault: false });
    }
}
