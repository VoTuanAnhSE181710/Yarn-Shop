import JoiBase from "joi";
import JoiDate from '@joi/date'
const Joi = JoiBase.extend(JoiDate);

export const createRoleSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Role name must be at least {#limit} characters',
            'string.max': 'Role name cannot exceed {#limit} characters',
            'any.required': 'Role name is required'
        }),
    permissions: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
            'array.base': 'Permissions must be an array',
            'string.base': 'All permissions must be strings'
        }),
    description: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Description cannot exceed {#limit} characters'
        }),
    isActive: Joi.boolean()
        .optional()
});

export const getAllRolesValidator = Joi.object({
    name: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
});

export const updateRoleSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Role name must be at least {#limit} characters',
            'string.max': 'Role name cannot exceed {#limit} characters'
        }),
    permissions: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
            'array.base': 'Permissions must be an array',
            'string.base': 'All permissions must be strings'
        }),
    description: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Description cannot exceed {#limit} characters'
        }),
    isActive: Joi.boolean()
        .optional()
});