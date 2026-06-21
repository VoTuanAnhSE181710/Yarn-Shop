import { BadRequestError } from "../error/error.js";

class CustomerService {
    #userRepository;
    #hashService;

    constructor({ userRepository, hashService }) {
        this.#userRepository = userRepository;
        this.#hashService = hashService;
    }

    updateMyProfile = async ({ userId, fullName, phone, address, avatarUrl }) => {
        const existingUser = await this.#userRepository.findUserById({ userId });

        if (!existingUser) {
            throw new BadRequestError("User not found");
        }

        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (avatarUrl !== undefined) updateData.avatar = { url: avatarUrl, publicId: null };

        const updatedUser = await this.#userRepository.updateUserData({
            userId,
            userData: updateData,
        });

        return updatedUser;
    };

    changeMyPassword = async ({ userId, oldPassword, newPassword }) => {
        const existingUser = await this.#userRepository.findUserById({ userId });

        if (!existingUser) {
            throw new BadRequestError("User not found");
        }

        const isMatch = await this.#hashService.compare({
            string: oldPassword,
            hashed: existingUser.password,
        });

        if (!isMatch) {
            throw new BadRequestError("Old password is incorrect");
        }

        const hashedPassword = await this.#hashService.hash({ string: newPassword });

        const updatedUser = await this.#userRepository.changePassword({
            userId,
            password: hashedPassword,
        });

        return updatedUser;
    };
}

export default CustomerService;