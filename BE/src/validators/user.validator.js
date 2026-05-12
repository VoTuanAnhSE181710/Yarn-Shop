import JoiBase from "joi";
import JoiDate from '@joi/date'
import mongoose from "mongoose";
const Joi = JoiBase.extend(JoiDate);

const loginSchema = Joi.object({
    username: Joi.string()
                .optional(),
    email: Joi.string()
            .email()
            .messages({
                'string.email': 'Invalid email format',
            })
            .optional(),
    password: Joi.string()
                .min(6)
                .required(),
}).xor('username', 'email').messages({
    'object.missing': 'Please provide either username or email to sign in',
})

const registerSchema = Joi.object({
    fullName: Joi.string().required(),
    username: Joi.string()
                .pattern(/^[a-zA-Z0-9_.-]+$/)
                .min(3).max(30)
                .messages({
                    'string.pattern.base': 'username contains invalid characters (allowed: -_.)',
                    'string.min': 'username must be at least {#limit} characters long',
                    'string.max': 'username cannot exceed {#limit} characters',
                }).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
                .min(8)
                .messages({
                    'string.min': 'Password must be at least {#limit} characters long',
                    'any.required': 'Password is required',
                })
                .required(),
    address: Joi.string().required(),
    phone: Joi.string().pattern(/^0[0-9]{9}$/).required(),
    gender: Joi.string().valid('MALE', 'FEMALE').messages({
        'any.only': 'Gender must be either MALE or FEMALE.'
    }).required(),
    dateOfBirth: Joi.date()
                    .format('MM/DD/YYYY')
                    .less('now')
                    .messages({
                        'date.format': 'format: MM/DD/YYYY'
                    }).required(),
    roleId: Joi.string()
    .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid')
        }
        return value;
    })
    .messages({
        'any.invalid': 'roleId must be a valid MongoDB ObjectId'
    })
})

const updateUserSchema = Joi.object({
    userData: Joi.object({
        email: Joi.string().email().optional(),
        fullName: Joi.string().min(3).optional(),
        address: Joi.string().optional(),
        phone: Joi.string().pattern(/^0[0-9]{9}$/).optional(),
        gender: Joi.string().valid('MALE', 'FEMALE').messages({
            'any.only': 'Gender must be either MALE or FEMALE.'
        }).optional(),
        dateOfBirth: Joi.date()
                        .format('MM/DD/YYYY')
                        .less('now')
                        .messages({
                            'date.format': 'format: MM/DD/YYYY'
                        }).optional(),
    }).required()
})

const updateStatusSchema = Joi.object({
    status: Joi.string()
                .valid('ACTIVE', 'INACTIVE')
                .messages({
                    'any.only': 'only ACTIVE, INACTIVE'
                })
                .required(),
    description: Joi.string().required(),
    
})

const getAllUserSchema = Joi.object({
    status: Joi.string()
                .valid('ACTIVE', 'INACTIVE', 'LOCKED')
                .messages({
                    'any.only': 'only ACTIVE, INACTIVE and LOCKED'
                }).optional(),
    roleId: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(10).max(20).default(10).optional(),
})

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
                    .min(8)
                    .messages({
                        'string.min': 'Password must be at least {#limit} characters long',
                        'any.required': 'Password is required',
                    })
                    .required(),
    email: Joi.string().email().required(),
})
const forgotPasswordSchema = Joi.object({
    newPassword: Joi.string()
                    .min(8)
                    .messages({
                        'string.min': 'Password must be at least {#limit} characters long',
                        'any.required': 'Password is required',
                    })
                    .required(),
    confirmPassword: Joi.string()
                    .min(8)
                    .messages({
                        'string.min': 'Password must be at least {#limit} characters long',
                        'any.required': 'Password is required',
                    })
                    .required(),
    uuid: Joi.string().uuid().required(),
})

export {
    loginSchema,
    registerSchema,
    updateUserSchema, 
    updateStatusSchema,
    getAllUserSchema,
    changePasswordSchema,
    forgotPasswordSchema,
};