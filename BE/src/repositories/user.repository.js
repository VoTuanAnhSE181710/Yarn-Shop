import { LOCK_TIME, MAX_LOGIN_ATTEMPTS } from '../constants/constants.js';
import User from '../models/user.js'

class UserRepository {
    findUserByPhone = async({ phone }) => {
        const existingUser = await User.findOne({ phone })
                                        .populate('roleId')
                                        .lean();
        if (!existingUser) {
            return null;
        }
        
        return {
            ...existingUser,
            userId: existingUser._id.toString(),
        }
    }
    findUserByEmail = async({ email }) => {
        const existingUser = await User.findOne({ email })
                                        .populate('roleId')
                                        .lean();
        if (!existingUser) {
            return null;
        }
        
        return {
            ...existingUser,
            userId: existingUser._id.toString(),
        }
    }

    findByUsername = async({ username }) => {
        const existingUser = await User.findOne({ username })
                                        .populate('roleId')
                                        .lean();
        if (!existingUser) {
            return null;
        }
        
        return {
            ...existingUser,
            userId: existingUser._id.toString(),
        }
    }

    findUserById = async ({ userId }) => {
        const exitstingUser = await User.findById(userId)
                                        .populate('roleId')
                                        .lean();
        if (!exitstingUser) {
            return null
        }

        return {
            ...exitstingUser,
            userId: exitstingUser._id.toString(),
        }
    }

    createUser = async ({
        username,
        email,
        password,
        phone,
        address,
        fullName,
        gender,
        dateOfBirth,
        roleId,
        createdBy,
    }) => {
        const newUser = await User.create({
            username,
            email,
            password,
            phone,
            address,
            fullName,
            gender,
            dateOfBirth,
            roleId,
            createdBy,
            status: "ACTIVE",
        });

        return newUser.toObject();
    }

    incrementLoginAttempts = async ({ userId }) => {
        const user = await User.findById(userId)
                                .populate('roleId')
                                .lean();

        const newAttempts = user.loginAttempts + 1;

        let updatedUser;
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        loginAttempts: newAttempts,
                        status: "LOCKED",
                        lockUntil: new Date(Date.now() + LOCK_TIME)
                    }
                },
                { returnDocument: 'after' }
            ).populate('roleId').lean()
        } else {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $inc: {
                        loginAttempts: 1
                    }
                }, { returnDocument: 'after' }
            ).populate('roleId').lean()
        }

        return {
            ...updatedUser,
            userId: updatedUser._id.toString(),
        }
    }

    resetLoginAttempts = async ({ userId }) => {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    loginAttempts: 0,
                    lockUntil: null, 
                }
            },
            { returnDocument: 'after' }
        ).populate('roleId').lean();

        return {
            ...updatedUser,
            userId: updatedUser._id.toString(),
        }
    }

    checkAndUnlockAccount = async ({ userId }) => {
        const user = await User.findById(userId).populate('roleId').lean()

        if (user.status === 'LOCKED' 
            && user.lockUntil 
            && user.lockUntil < Date.now()) {
            const unlockedUser =  await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        status: 'ACTIVE',
                        loginAttempts: 0,
                        lockUntil: null,
                    }
                },
                { returnDocument: 'after' }
            ).populate('roleId').lean()

            return {
                ...unlockedUser,
                userId: unlockedUser._id.toString(),
            }
        }

        return {
            ...user,
            userId: user._id.toString(),
        };
    }

    updateUserData = async ({ userId, userData }) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: userData,
                },
                {
                    new: true,
                    context: 'query',
                }
            ).populate('roleId').lean()

            return {
                ...updatedUser,
                password: undefined,
                userId: updatedUser._id.toString(),
            }
        } catch (error) {
            console.error(error);
        }
    }

    updateUserAvatar = async ({ userId, avatar }) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: { avatar }
                },
                {
                    returnDocument: 'after',
                    context: "query"
                }
            ).populate('roleId').lean()

            return {
                ...updatedUser,
                password: undefined,
                userId: updatedUser._id.toString(),
            }
        } catch (error) {
            console.log(error);
        }
    }
    updateUserStatus = async ({ userId, status }) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: { status }
                },
                {
                    returnDocument: 'after',
                    context: "query"
                }
            ).populate('roleId').lean()

            return {
                ...updatedUser,
                password: undefined,
                userId: updatedUser._id.toString(),
            }
        } catch (error) {
            console.log(error);
        }
    }

    getAllUsers = async ({
        page,
        limit,
        roleId,
        status,
    }) => {
        const skip = (page - 1) * limit;

        const filter = {};

        if (status) filter.status = status;
        if (roleId) filter.roleId = roleId;

        const [users, total] = await Promise.all([
            User.find(filter)
                .populate('roleId')
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        return {
            users: users.map(user => ({
                ...user,
                password: undefined,
                userId: user._id.toString(),
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            }
        }
    }

    softDeleteUser = async ({ userId, deletedBy }) => {
        try {
            const deletedUser = await User.findByIdAndUpdate(
                
                userId,
                {
                    $set: { status: "INACTIVE",
                            deletedAt: new Date(),
                            deletedBy: deletedBy
                     },
                },
                {
                    returnDocument: 'after',
                    context: "query"
                }
            ).populate('roleId').lean()

            if(!deletedUser){
                throw new Error("User not found");
            }

            return {
                ...deletedUser,
                userId: deletedUser._id.toString(),
            }
        } catch (error) {
            console.log(error);
        }
    }

    changePassword = async ({ userId, password }) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        password: password,
                        loginAttempts: 0,
                        lockUntil: null
                    }
                },
                {
                    returnDocument: 'after',
                    context: "query"
                }
            ).populate('roleId').lean()

            return {
                ...updatedUser,
                password: undefined,
                userId: updatedUser._id.toString(),
            }
        } catch (error) {
            console.log(error);
        }
    }

    changeUserRole = async ({ userId, roleId }) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: { roleId: roleId }
                },
                {
                    returnDocument: 'after',
                    context: "query"
                }
            ).populate('roleId').lean()

            if (!updatedUser) {
                return null;
            }

            return {
                ...updatedUser,
                userId: updatedUser._id.toString(),
            }
        } catch (error) {
            console.log(error);
        }
    }

    getStatistics = async () => {
        const [totalUsers, activeUsers, inactiveUsers, lockedUsers, usersByRole, usersByStatus] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: 'ACTIVE' }),
            User.countDocuments({ status: 'INACTIVE' }),
            User.countDocuments({ lockUntil: { $gt: new Date() } }),
            User.aggregate([
                {
                    $group: {
                        _id: '$roleId',
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'roles',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'roleInfo'
                    }
                },
                { $unwind: '$roleInfo' },
                {
                    $project: {
                        roleName: '$roleInfo.roleName',
                        count: 1,
                        _id: 0
                    }
                },
                { $sort: { count: -1 } }
            ]),
            User.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        status: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            ])
        ]);

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,
            lockedUsers,
            usersByRole,
            usersByStatus
        };
    }
}

export default UserRepository