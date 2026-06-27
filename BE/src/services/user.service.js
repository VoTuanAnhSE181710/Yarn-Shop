import { ACTIONS, OUTCOMES, TARGET_TYPES } from "../constants/constants.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../error/error.js";

class UserService {
    #userRepository
    #logRepository
    #cloudinary
    #roleRepository

    constructor({
        userRepository,
        logRepository,
        cloudinary,
        roleRepository,
    }) {
        this.#userRepository = userRepository;
        this.#logRepository = logRepository;
        this.#cloudinary = cloudinary;
        this.#roleRepository = roleRepository;
    }

    updateUserData = async ({
        queryUserId, 
        userData,
        userId
    }) => {
        const existingUser = await this.#userRepository.findUserById({ userId: queryUserId });

        if (!existingUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "user does not exists!",
                }
            })
            throw new BadRequestError(`Please provide the correct userId`)
        }

        const currentUser = await this.#userRepository.findUserById({ userId: userId })

        if (existingUser.userId !== userId && currentUser.roleId.roleName !== 'Admin') {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "dont provide their own userID",
                }
            })
            throw new BadRequestError(`You can only update your data`)
        }

        if (userData.email || userData.phone) {
            const emailExists = await this.#userRepository.findUserByEmail({ email: userData.email });

            const phoneExists = await this.#userRepository.findUserByPhone({ phone: userData.phone })

            if (emailExists || phoneExists) {
                await this.#logRepository.saveLog({
                    action: ACTIONS.UPDATE,
                    targetType: TARGET_TYPES.USER,
                    outcome: OUTCOMES.FAILED,
                    actorId: userId,
                    details: {
                        reason: "duplicate email or phone",
                        email: emailExists,
                        phone: phoneExists,
                    }
                })
                throw new BadRequestError(`this email or phone cant be duplicate`)
            }
        }

        const updatedUser = await this.#userRepository.updateUserData({
            userId: queryUserId,
            userData: userData,
        });

        if (updatedUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.SUCCESS,
                actorId: userId,
                details: {
                    fieldChanged: userData,
                }
            })
        }

        if (!updatedUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "fail to update user info!",
                }
            })
            throw new BadRequestError(`Failed to update user info`)
        }

        return updatedUser;
    }

    updateUserAvatar = async ({
        userId,
        queryUserId,
        imageFile,
    }) => {
        const existingUser = await this.#userRepository.findUserById({ userId: queryUserId });

        if (!existingUser) {
            if (imageFile) {
                await this.#cloudinary.uploader.destroy(imageFile.filename)
            }
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "user does not exists!",
                }
            })
            throw new BadRequestError(`Please provide the correct userId`)
        }

        if (existingUser.userId !== userId) {
            if (imageFile) {
                await this.#cloudinary.uploader.destroy(imageFile.filename)
            }
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "dont provide their own userID",
                }
            })
            throw new BadRequestError(`You can only update your data`)
        }

        if (existingUser.avatar?.publicId) {
            await this.#cloudinary.uploader.destroy(existingUser.avatar.publicId)
        }

        const avatar = {
            url: imageFile.path,
            publicId: imageFile.filename
        }

        const updatedUser = await this.#userRepository.updateUserAvatar({
            userId: queryUserId,
            avatar: avatar,
        })

        return updatedUser;
    }

    updateUserStatus = async ({
        userId,
        queryUserId,
        status,
        description
    }) => {
        const existingUser = await this.#userRepository.findUserById({ userId: queryUserId })

        if (!existingUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "fail to change user status"
                }
            })
            throw new BadRequestError(`this user does not exists!`)
        }

        const updateStatusResult = await this.#userRepository.updateUserStatus({ 
            userId: existingUser.userId, 
            status: status
        })

        if (updateStatusResult) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.SUCCESS,
                actorId: userId,
                details: {
                    reason: description,
                }
            })
        }

        if (!updateStatusResult) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "fail to change user status"
                }
            })
            throw new BadRequestError('fail to update user status')
        }

        return updateStatusResult;
    }

    getAllUsers = async ({
        page,
        limit,
        roleId,
        status,
    }) => {
        const result = await this.#userRepository.getAllUsers({
            page,
            limit,
            roleId,
            status,
        })

        return result;
    }

    getUserById = async ({ queryUserId }) => {
        const existingUser = await this.#userRepository.findUserById({ userId: queryUserId })

        if (!existingUser) {
            throw new BadRequestError(`This user does not exist`)
        }

        return {
            ...existingUser,
            password: undefined,
        };
    }

    getMyProfile = async ({ userId }) => {
        const userProfile = await this.#userRepository.findUserById({ userId });

        if (!userProfile) {
            throw new BadRequestError(`this user does not exists!`)
        }
        return userProfile;
    }

    softDeleteUser = async ({ queryUserId, userId }) => {
        const existingUser = await this.#userRepository.findUserById({ userId: queryUserId })

        if (!existingUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.DELETE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "User not found"
                }
            })
            throw new BadRequestError("User does not exist!")
        }

        if (existingUser.userId === userId) {
            await this.#logRepository.saveLog({
                action: ACTIONS.DELETE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "User delete their own account"
                }
            })
            throw new BadRequestError("Cannot delete your own account")
        }

        // Check if user is already deleted or disabled
        if (existingUser.status === 'INACTIVE') {
            await this.#logRepository.saveLog({
                action: ACTIONS.DELETE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "User is already deleted or disabled",
                    userId: userId
                }
            })
            throw new BadRequestError("User is already deleted or disabled!")
        }

        const deletedUser = await this.#userRepository.softDeleteUser({ userId: existingUser.userId })
        
        await this.#logRepository.saveLog({
            action: ACTIONS.DELETE,
            targetType: TARGET_TYPES.USER,
            outcome: OUTCOMES.SUCCESS,
            actorId: userId,
            details: {
                deletedUserId: userId,
                previousStatus: existingUser.status
            }
        })
        
        return deletedUser;
    }

    changeUserRole = async ({ queryUserId, roleId, userId }) => {
        const currentUser = await this.#userRepository.findUserById({ userId });
        if (!currentUser) {
            throw new BadRequestError("Authenticated user not found");
        }

        if (currentUser.roleId.roleName !== 'Admin') {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: { reason: "Non-admin attempted to change user role" }
            })
            throw new ForbiddenError("Access denied. Only Admin can change user roles.");
        }

        const targetUser = await this.#userRepository.findUserById({ userId: queryUserId });
        if (!targetUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: { reason: "Target user not found" }
            })
            throw new NotFoundError("User does not exist!");
        }

        if (queryUserId === userId) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: { reason: "Admin attempted to change their own role" }
            })
            throw new BadRequestError("Cannot change your own role");
        }

        const role = await this.#roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundError("Role does not exist!");
        }

        if (targetUser.roleId._id.toString() === roleId) {
            throw new BadRequestError("User already has this role");
        }

        const updatedUser = await this.#userRepository.changeUserRole({ userId: queryUserId, roleId });

        if (!updatedUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: { reason: "Failed to change user role" }
            })
            throw new BadRequestError("Failed to change user role");
        }

        await this.#logRepository.saveLog({
            action: ACTIONS.UPDATE,
            targetType: TARGET_TYPES.USER,
            outcome: OUTCOMES.SUCCESS,
            actorId: userId,
            details: {
                targetUserId: queryUserId,
                previousRole: targetUser.roleId.roleName,
                newRole: role.roleName,
            }
        })

        return {
            ...updatedUser,
            password: undefined,
        };
    }

    getStatistics = async () => {
        const statistics = await this.#userRepository.getStatistics();
        return {
            message: 'User statistics retrieved successfully.',
            data: statistics
        };
    }
}

export default UserService