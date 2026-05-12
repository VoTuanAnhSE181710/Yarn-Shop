import Joi from 'joi'

const otpSendSchema = Joi.object({
    email: Joi.string().email().required(),
})

const otpVerifySchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string()
            .pattern(/^[0-9]{6}$/)
            .required(),
})

const otlVerifySchema = Joi.object({
    uuid: Joi.string().uuid().required(),
})

export { otpSendSchema, otpVerifySchema, otlVerifySchema };