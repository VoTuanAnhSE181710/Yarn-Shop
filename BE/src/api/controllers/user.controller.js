
class UserController {
    #userService

    constructor({ userService }){
        this.#userService = userService;
    }

    update = async (req, res, next) => {
        try {
            const { userId } = req.user

            const { queryUserId } = req.params

            const userData = req.body.userData

            const updatedResult = await this.#userService.updateUserData({ queryUserId, userData, userId });

            res.status(200).json({
                status: 'success',
                data: {
                    updatedResult,
                }
            })

        } catch (error) {
            next(error)
        }
    }

    updateUserAvatar = async (req, res, next) => {
        try {
            const { userId } = req.user
            
            const { queryUserId } = req.params

            const imageFile = req.file

            const updatedUser = await this.#userService.updateUserAvatar({
                userId,
                queryUserId,
                imageFile,
            })
            
            res.status(200).json({
                status: 'success',
                data: {
                    updatedUser,
                }
            })
        } catch (error) {
            next(error)
        }
    }
    
    updateStatus = async (req, res, next) => {
        const { userId } = req.user

        const { queryUserId } = req.params

        const {
            status,
            description,
        } = req.body

        try {
            const updateResult = await this.#userService.updateUserStatus({
                userId,
                queryUserId,
                status,
                description,
            })

            res.status(200).json({
                status: 'success',
                data: {
                    updateResult,
                }
            })
        } catch (error) {
            next(error)
        }
    }

    getAllUsers = async (req, res, next) => {
        try {
            const { page, limit, roleId, status } = req.query

            const result = await this.#userService.getAllUsers({
                page,
                limit,
                roleId,
                status,
            })
            res.status(200).json({
                status: 'success',
                data: {
                    result,
                }
            })

        } catch (error) {
            next(error)
        }
    }

    getUserById = async (req, res, next) => {
        try {
            const { queryUserId } = req.params
    
            const result = await this.#userService.getUserById({ queryUserId })

            res.status(200).json({
                status: 'success',
                data: {
                    result,
                }
            })
        } catch (error) {
            next(error)
        }
    }
            
    getMyProfile = async (req, res, next) => {
        const { userId } = req.user
        try {
            const userProfile = await this.#userService.getMyProfile({ userId })

            res.status(200).json({
                status: 'success',
                data: {
                    userProfile,
                }
            })
        } catch (error) {
            next(error)
        }
    }

    softDelete = async (req, res, next) => {
        const { userId } = req.user

        const { queryUserId } = req.params

        try{
            const deleteResult = await this.#userService.softDeleteUser({ queryUserId, userId })

            res.status(200).json({
                status: 'success',
                data: {
                    deleteResult,
                }
            })
        } catch (error) {
            next(error)
        }
    }

    changeRole = async (req, res, next) => {
        try {
            const { userId } = req.user
            const { queryUserId } = req.params
            const { roleId } = req.body

            const result = await this.#userService.changeUserRole({
                queryUserId,
                roleId,
                userId,
            })

            res.status(200).json({
                status: 'success',
                message: 'User role changed successfully',
                data: {
                    result,
                }
            })
        } catch (error) {
            next(error)
        }
    }

    getStatistics = async (req, res, next) => {
        try {
            const result = await this.#userService.getStatistics();
            res.status(200).json({
                status: 'success',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default UserController;