import Joi from "joi";

export const createVideoSchema = Joi.object({
    title: Joi.string().required().trim().min(1).max(200).messages({
        "string.empty": "Video title is required",
        "string.min": "Video title must be at least 1 character",
        "string.max": "Video title must not exceed 200 characters",
    }),
    description: Joi.string().allow("").max(2000).messages({
        "string.max": "Description must not exceed 2000 characters",
    }),
    type: Joi.string().valid("community", "premium").required().messages({
        "any.only": "Video type must be 'community' or 'premium'",
        "any.required": "Video type is required",
    }),
    url: Joi.string().required().uri().messages({
        "string.empty": "Video URL is required",
        "string.uri": "Video URL must be a valid URI",
    }),
    thumbnail: Joi.object({
        url: Joi.string().uri().allow(null).default(null),
        publicId: Joi.string().allow(null).default(null),
    }).optional(),
    duration: Joi.number().min(0).default(0).messages({
        "number.min": "Duration must be a positive number",
    }),
    category: Joi.string().hex().length(24).allow(null).messages({
        "string.hex": "Category must be a valid ObjectId",
        "string.length": "Category must be a valid ObjectId",
    }),
    tags: Joi.array().items(Joi.string().trim()).optional(),
});

export const updateVideoSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).messages({
        "string.min": "Video title must be at least 1 character",
        "string.max": "Video title must not exceed 200 characters",
    }),
    description: Joi.string().allow("").max(2000),
    thumbnail: Joi.object({
        url: Joi.string().uri().allow(null),
        publicId: Joi.string().allow(null),
    }).optional(),
    duration: Joi.number().min(0),
    category: Joi.string().hex().length(24).allow(null),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    isActive: Joi.boolean(),
    status: Joi.string().valid("PENDING", "APPROVED", "REJECTED"),
});

export const videoQuerySchema = Joi.object({
    type: Joi.string().valid("community", "premium"),
    category: Joi.string().hex().length(24),
    search: Joi.string().trim(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sort: Joi.string().valid("newest", "oldest", "most_viewed").default("newest"),
});