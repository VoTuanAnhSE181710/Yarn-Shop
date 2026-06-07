import { UAParser } from 'ua-parser-js'

class AuthController {
    #authService;
    constructor({ authService }) {
        this.#authService = authService;
    }

    #getUserDeviceName = (req, res, next) => {
        const ua = req.headers['user-agent'];

        const parser = new UAParser(ua);
        const result = parser.getResult();

        const browser = `${result.browser.name || 'Unknown browser'} ${result.browser.version || ''}`.trim();
        const os = `${result.os.name || 'Unknown OS'} ${result.os.version || ''}`.trim();
        const device = result.device;

        if (device.type === 'mobile' || device.type === 'tablet') {
            const vendor = device.vendor || '';
            const model = device.model || '';
            return `${vendor}-${model}-${os}-${browser}`;
        }

        return `${os}-${browser}`
    }

    login = async (req, res , next) => {
        try {
            const { username, email, password } = req.body

            const deviceName = this.#getUserDeviceName(req, res, next);
    
            const { accessToken, refreshToken, subscription, user } = await this.#authService.login({
                username, 
                email, 
                password, 
                deviceName, 
            });
    
            res.status(200).json({
                status: "success",
                data: {
                    accessToken,
                    refreshToken,
                    subscription,
                    user,
                },
            })
        } catch (error) {
            next(error);
        }
    }

    publicRegister = async (req, res, next) => {
        try {
            const {
                username,
                email,
                password,
                phone,
                address,
                fullName,
                gender,
                dateOfBirth,
            } = req.body

            const newUser = await this.#authService.publicRegister({
                username,
                email,
                password,
                phone,
                address,
                fullName,
                gender,
                dateOfBirth,
            });

            res.status(201).json({
                status: "success",
                data: newUser,
            })
        } catch (error) {
            next(error)
        }
    }

    register = async (req, res, next) => {
        const { userId } = req.user
        try {
            const {
                username,
                email,
                password,
                phone,
                address,
                fullName,
                gender,
                dateOfBirth,
                roleId,
            } = req.body

            const newUser = await this.#authService.register({
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
            });

            res.status(201).json({
                status: "success",
                data: newUser,
            })
        } catch (error) {
            next(error)
        }
    }

    logout = async (req, res, next) => {
        try {
            const { userId, deviceId } = req.user

            const result = await this.#authService.logout({ userId, deviceId })
            if (!result) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cannot logout'
                })
            }

            res.status(200).json({
                status: "success",
                message: "logout successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    refreshToken = async (req, res, next) => {
        try {
            const { oldRefreshToken } = req.body

            const deviceName = this.#getUserDeviceName(req, res, next);

            const { accessToken, refreshToken } = 
                    await this.#authService.refreshToken({
                        oldRefreshToken,
                        deviceName, 
                    });
            res.status(200).json({
                status: "success",
                data: {
                    accessToken,
                    refreshToken,
                },
            })
        } catch (error) {
            next(error)
        }
    }

    changePassword = async (req, res, next) => {
        try {
            const { oldPassword, newPassword, email } = req.body

            const { userId } = req.user

            const updateStatus = await this.#authService.changePassword({
                oldPassword,
                newPassword,
                email,
                userId,
            })

            if (!updateStatus) {
                return res.status(400).json({
                    status: "error",
                    message: "cannot change password"
                })
            }

            res.status(200).json({
                status: "success",
                message: "Password has been changed successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    forgotPassword = async (req, res, next) => {
        try {
            const { newPassword, confirmPassword, uuid } = req.body

            await this.#authService.forgotPassword({
                newPassword,
                confirmPassword,
                uuid,
            })

            res.status(200).json({
                status: "success",
                message: "Password has been changed successfully"
            })
        } catch (error) {
            next(error)
        }
    }
}

export default AuthController;