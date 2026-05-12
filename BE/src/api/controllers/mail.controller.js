class MailController {
    #mailService

    constructor({ mailService }){
        this.#mailService = mailService;
    }

    sendOtp = async (req, res, next) => {
        try {
            const { email } = req.body

            const { userId } = req.user

            await this.#mailService.sentOTPEmail({ email, userId });

            res.status(200).json({
                status: 'success',
                message: 'OTP email sent successfully'
            })
        } catch (error) {
            next(error)
        }
    }

    verifyOtp = async (req, res, next) => {
        try {
            const { email, otp } = req.body

            const { userId } = req.user

            const isValid = await this.#mailService.verifyOTPEmail({ email, otp, userId })

            if (!isValid) {
                return res.status(400).json({
                    status: 'error',
                    message: 'OTP is invalid or expired!'
                })
            }

            res.status(200).json({
                status: 'success',
                message: "OTP verified successfully",
                isValid: true,
            })
        } catch (error) {
            next(error)
        }
    }

    sendForgotPasswordLink = async (req, res, next) => {
        try {
            const { email } = req.body

            await this.#mailService.sendForgotPasswordLink({ email })

             res.status(200).json({
                status: 'success',
                message: 'Reset password link sent successfully'
            })
        } catch (error) {
            next(error)
        }
    }

    verifyAccessLinkKey = async (req, res, next) => {
        try {
            const { uuid } = req.query

            const isValid = await this.#mailService.verifyAccessLinkKey({ uuid });

            if (!isValid) {
                return res.status(400).json({
                    status: 'error',
                    message: 'link is invalid or expired!'
                })
            }

            res.status(200).json({
                status: 'success',
                message: 'Link verified!',
                isValid: isValid,
            })
        } catch (error) {
            next(error)
        }
    }
}

export default MailController