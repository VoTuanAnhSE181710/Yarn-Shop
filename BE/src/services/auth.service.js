import { ACTIONS, LOGIN_STATUS, MAX_LOGIN_ATTEMPTS, OUTCOMES, TARGET_TYPES } from "../constants/constants.js";
import { AuthenticationError, AuthorizationError, BadRequestError } from "../error/error.js";
import User from "../models/user.js";

class AuthService {
    #userRepository;
    #hashService;
    #tokenService;
    #logRepository;
    #roleRepository;
    #mailService;
    constructor({
        userRepository,
        hashService,
        tokenService,
        logRepository,
        roleRepository,
        mailService,
    }) {
        this.#userRepository = userRepository;
        this.#hashService = hashService;
        this.#tokenService = tokenService;
        this.#logRepository = logRepository;
        this.#roleRepository = roleRepository;
        this.#mailService = mailService;
    }

    login = async ({ 
        username, 
        email , 
        password, 
        deviceName, 
    }) => {
        let existingUser = await this.#userRepository.findUserByEmail({
            email: email,
        }) || 
        await this.#userRepository.findByUsername({
            username: username,
        });

        if (existingUser && existingUser.status === LOGIN_STATUS.LOCKED) {
            existingUser = await this.#userRepository.checkAndUnlockAccount({ userId: existingUser.userId })
            const timeDiff = new Date(existingUser.lockUntil).getTime() - Date.now();

            const minsLeft = Math.ceil(timeDiff / (1000 * 60))

            if (minsLeft <= 0) {
                throw new AuthenticationError(`Please try again!`)
            }

            throw new AuthenticationError(`Please try again after ${minsLeft} minutes!`)
        }

        if (!existingUser || existingUser.status !== LOGIN_STATUS.ACTIVE) {
            await this.#logRepository.saveLog({
                action: ACTIONS.LOGIN,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: null,
                details: {
                    email: email,
                    username: username,
                    reason: !existingUser ? "This account doesnt exists" : "This account is not active"
                },
            })
            throw new AuthenticationError('username or email is invalid or account is inactive!')
        }

        const isMatchedPassword = await this.#hashService.compare({
            string: password,
            hashed: existingUser.password,
        })

        if (!isMatchedPassword) {
            const updatedUser = await this.#userRepository.incrementLoginAttempts({ userId: existingUser.userId })

            const attemptsLeft = MAX_LOGIN_ATTEMPTS - updatedUser.loginAttempts;
            await this.#logRepository.saveLog({
                action: ACTIONS.LOGIN,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: existingUser.userId,
                details: {
                    email: existingUser.email,
                    username: existingUser.username,
                    reason: "Invalid password",
                },
            })

            if (updatedUser.status === LOGIN_STATUS.LOCKED) {
                throw new AuthenticationError(`Account locked due to multiple failed attempts. Try again in 15 minutes.`)
            }

            throw new AuthenticationError(`Invalid password. ${attemptsLeft} attempt(s) remaining.`)
        }

        await this.#userRepository.resetLoginAttempts({ userId: existingUser.userId })
        
        const { accessToken, refreshToken, deviceId, jti } = this.#tokenService.generateToken({
            userId: existingUser.userId,
            fullName: existingUser.fullName,
            roleName: existingUser.roleId.roleName,
            roleId: existingUser.roleId._id,
        });

        await this.#logRepository.saveLog({
                action: ACTIONS.LOGIN,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.SUCCESS,
                actorId: existingUser.userId,
                details: {
                    username: existingUser.username,
                    email: existingUser.email,
                    jti: jti,
                },
            })

        await this.#tokenService.saveRefreshToken({
            userId: existingUser.userId,
            refreshToken: refreshToken,
            deviceId: deviceId,
            deviceName: deviceName
        });

        return { 
            accessToken, 
            refreshToken,
            subscription: existingUser.subscription || "Freemium",
            user: {
                userId: existingUser.userId,
                fullName: existingUser.fullName,
                email: existingUser.email,
                username: existingUser.username,
            }
        }
    }

    logout = async ({
        userId,
        deviceId,
    }) => {
        const isOwner = await this.#tokenService.verifyOwner({
            userId,
            deviceId,
        })

        if (isOwner !== 1) {
            throw new BadRequestError(`This is not your own account!`)
        }

        const deletedCount = await this.#tokenService.revokeRefreshToken({
            userId,
            deviceId,
        })

        if (deletedCount === 0) {
            throw new AuthorizationError('Token does not exist or already deleted!')
        }

        return true;
    }

    /**
     * Public registration - auto assigns Customer role + Freemium subscription
     */
    publicRegister = async ({
        username,
        email,
        password,
        phone,
        address,
        fullName,
        gender,
        dateOfBirth,
    }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();
        
        const existingUser = await this.#userRepository.findUserByEmail({
            email: normalizedEmail,
        }) || await this.#userRepository.findByUsername({
            username: normalizedUsername
        })

        if (existingUser) {
            throw new BadRequestError("This user already exists!")
        }

        // Auto-find Customer role
        const customerRole = await this.#roleRepository.findByRoleName({ roleName: "Customer" });

        if (!customerRole) {
            throw new BadRequestError("Customer role not found. Please run seed data first.");
        }

        const hashedPassword = await this.#hashService.hash({ string: password });

        const newUser = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            phone,
            address,
            fullName,
            gender,
            dateOfBirth,
            roleId: customerRole._id,
            subscription: "Freemium",
            status: "ACTIVE",
        });

        return {
            ...newUser.toObject(),
            password: undefined,
        };
    }

    register = async ({
        username,
        email,
        password,
        phone,
        address,
        fullName,
        gender,
        dateOfBirth,
        roleId,
        userId,
    }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();
        
        const existingUser = await this.#userRepository.findUserByEmail({
            email: normalizedEmail,
        }) || await this.#userRepository.findByUsername({
            username: normalizedUsername
        })

        if (existingUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.REGISTER,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "This account user is already exists!"
                },
            })
            throw new BadRequestError("This user is already exists!")
        }

        const isExistingRole = await this.#roleRepository.findById(roleId);

        if (!isExistingRole) {
            await this.#logRepository.saveLog({
                action: ACTIONS.REGISTER,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "This role does not exist!"
                },
            })
            throw new BadRequestError("This role does not exist!")
        }

        const hashedPassword = await this.#hashService.hash({ string: password });

        const newUser = await this.#userRepository.createUser({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            phone,
            address,
            fullName,
            gender,
            dateOfBirth,
            roleId,
            createdBy: userId,
        });

        await this.#logRepository.saveLog({
            action: ACTIONS.REGISTER,
            targetType: TARGET_TYPES.USER,
            outcome: newUser ? OUTCOMES.SUCCESS : OUTCOMES.FAILED,
            actorId: userId,
            details: {
                userEmail: email,
                roleAssigned: roleId,
            }
        })
        
        return {
            ...newUser,
            password: undefined,
            _id: undefined,
            __v: undefined,
        };
    }

    refreshToken = async ({ 
        oldRefreshToken,
        deviceName, 
    }) => {
        const decoded = await this.#tokenService.verifyRefreshToken({
            token: oldRefreshToken,
        })

        const user = await this.#userRepository.findUserById({
            userId: decoded.userId,
        })

        if (!user) {
            throw new BadRequestError(`Token doesn't exist or expired!`)
        }

        const deletedCount = await this.#tokenService.revokeRefreshToken({
            userId: user.userId,
            deviceId: decoded.deviceId, 
        });

        if (deletedCount === 0) {
            throw new AuthorizationError('Token does not exist or already deleted!')
        }

        const { accessToken, refreshToken, deviceId } = this.#tokenService.generateToken({
            userId: user.userId,
            fullName: user.fullName,
            roleName: user.roleId.roleName,
            roleId: user.roleId._id,
            deviceId: decoded.deviceId,
        })

        await this.#tokenService.saveRefreshToken({
            userId: user.userId,
            refreshToken: refreshToken,
            deviceId: deviceId,
            deviceName: deviceName,
        });

        return { accessToken, refreshToken }
    }

    changePassword = async ({
        oldPassword,
        newPassword,
        email,
        userId,
    }) => {
        
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await this.#userRepository.findUserById({ userId });

        if (!existingUser || normalizedEmail !== existingUser.email) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "wrong user email",
                    email: normalizedEmail,
                }
            })
            throw new BadRequestError(`Please provide the right user email!`)
        }

        const isVerified = await this.#mailService.isOTPVerified({ email: normalizedEmail })

        if (!isVerified) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "OTP expired",
                    email: normalizedEmail,
                }
            })
            throw new BadRequestError(`OTP verification expired`)
        }

        const isMatchedPassword = await this.#hashService.compare({
            string: oldPassword,
            hashed: existingUser.password,
        })

        if (!isMatchedPassword) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "wrong old password",
                    email: normalizedEmail,
                }
            })
            throw new BadRequestError(`Old password is incorrect`)
        }

        const hashedPassword = await this.#hashService.hash({ string: newPassword })

        const updatedUser = await this.#userRepository.changePassword({
            userId: existingUser.userId,
            password: hashedPassword,
        })

        if (!updatedUser) {
            await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.FAILED,
                actorId: userId,
                details: {
                    reason: "function when wrong",
                    email: normalizedEmail,
                }
            })
            throw new BadRequestError(`Cannot change password`)
        }

        await Promise.all([
            await this.#mailService.clearVerifiedOTP({ email: normalizedEmail }),
            await this.#tokenService.removeAllRefreshToken({
                userId: existingUser.userId,
            })
        ])

        await this.#logRepository.saveLog({
                action: ACTIONS.UPDATE,
                targetType: TARGET_TYPES.USER,
                outcome: OUTCOMES.SUCCESS,
                actorId: userId,
                details: {
                    email: normalizedEmail,
                }
            })

        return updatedUser;
    }

    forgotPassword = async ({
        newPassword,
        confirmPassword,
        uuid,
    }) => {
        const email = await this.#mailService.verifyAccessLinkKey({ uuid })

        if (!email) {
            throw new BadRequestError(`Link is expired!`)
        }

        const existingUser = await this.#userRepository.findUserByEmail({ email });

        if (!existingUser) {
            throw new BadRequestError(`This user doesn't exist!`)
        }

        if (newPassword !== confirmPassword) {
            throw new BadRequestError(`Please confirm your password again`)
        }
        
        const hashedPassword = await this.#hashService.hash({ string: newPassword});

        const updatedUser = await this.#userRepository.changePassword({
            userId: existingUser.userId,
            password: hashedPassword,
        })

        if (!updatedUser) {
            throw new BadRequestError(`Cannot change password`);
        }

        const isDeletedAccessKey = await this.#mailService.clearVerifiedAccessLinkKey({ uuid });

        if (isDeletedAccessKey !== 1) {
            throw new BadRequestError("this key is expired!");
        }

        return updatedUser;
    }
}

export default AuthService;