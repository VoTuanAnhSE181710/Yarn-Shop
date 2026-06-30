import Joi from "joi";

export const createLessonSchema = Joi.object({
    title: Joi.string().required().trim().min(1).max(200).messages({
        "string.empty": "Lesson title is required",
        "string.min": "Lesson title must be at least 1 character",
        "string.max": "Lesson title must not exceed 200 characters",
    }),
    order: Joi.number().integer().min(1).required().messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
        "any.required": "Order is required",
    }),
    videoUrl: Joi.string().required().uri().messages({
        "string.empty": "Video URL is required",
        "string.uri": "Video URL must be a valid URI",
    }),
    duration: Joi.number().min(0).default(0).messages({
        "number.min": "Duration must be a positive number",
    }),
    linkedProduct: Joi.array().items(Joi.object({
        productId: Joi.string().hex().length(24).required().messages({
            "string.hex": "Product ID must be a valid ObjectId",
            "any.required": "Product ID is required",
        }),
    })).optional(),
    linkedCombo: Joi.array().items(Joi.object({
        comboId: Joi.string().hex().length(24).required().messages({
            "string.hex": "Combo ID must be a valid ObjectId",
            "any.required": "Combo ID is required",
        }),
    })).optional(),
    isPreview: Joi.boolean().default(false),
});

export const updateLessonSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).messages({
        "string.min": "Lesson title must be at least 1 character",
        "string.max": "Lesson title must not exceed 200 characters",
    }),
    order: Joi.number().integer().min(1),
    videoUrl: Joi.string().uri(),
    duration: Joi.number().min(0),
    linkedProduct: Joi.array().items(Joi.object({
        productId: Joi.string().hex().length(24).required(),
    })).optional(),
    linkedCombo: Joi.array().items(Joi.object({
        comboId: Joi.string().hex().length(24).required(),
    })).optional(),
    isPreview: Joi.boolean(),
});