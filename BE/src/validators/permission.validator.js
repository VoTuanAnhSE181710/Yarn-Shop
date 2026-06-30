import JoiBase from "joi";
import JoiDate from '@joi/date'
const Joi = JoiBase.extend(JoiDate);

export const createPermissionSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    resource: Joi.string().required(),
    action: Joi.string().valid("create", "read", "update", "delete", "manage").required()
});

export const updatePermissionSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    resource: Joi.string().optional(),
    action: Joi.string().valid("create", "read", "update", "delete", "manage").optional()
}).or('name', 'description', 'resource', 'action').messages({
    'object.missing': 'At least one field (name, description, resource, action) must be provided for update'
});

export const getPermissionsSchema = Joi.object({
    name: Joi.string().optional(),
    resource: Joi.string().optional(),
    action: Joi.string().valid("create", "read", "update", "delete", "manage").optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
});
