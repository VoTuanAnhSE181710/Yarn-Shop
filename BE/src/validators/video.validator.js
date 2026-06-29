import Joi from "joi";

export const getUploadUrlSchema = Joi.object({
    filename: Joi.string().required().trim().messages({
        "string.empty": "Filename is required",
        "any.required": "Filename is required",
    }),
    mimeType: Joi.string().required().pattern(/^video\//).messages({
        "string.empty": "MIME type is required",
        "string.pattern.base": "MIME type must be a video type (e.g., video/mp4)",
        "any.required": "MIME type is required",
    }),
    size: Joi.number().required().min(1).max(5 * 1024 * 1024 * 1024).messages({
        "number.base": "Size must be a number",
        "number.min": "Size must be greater than 0",
        "number.max": "Size must not exceed 5GB",
        "any.required": "Size is required",
    }),
    title: Joi.string().required().trim().min(1).max(200).messages({
        "string.empty": "Video title is required",
        "string.min": "Video title must be at least 1 character",
        "string.max": "Video title must not exceed 200 characters",
        "any.required": "Video title is required",
    }),
    description: Joi.string().allow("").max(2000).messages({
        "string.max": "Description must not exceed 2000 characters",
    }),
    visibility: Joi.string().valid("public", "private", "unlisted").default("private").messages({
        "any.only": "Visibility must be 'public', 'private', or 'unlisted'",
    }),
});

export const confirmUploadSchema = Joi.object({
    duration: Joi.number().min(0).default(0).messages({
        "number.min": "Duration must be a positive number",
    }),
});

export const updateVideoSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).messages({
        "string.min": "Video title must be at least 1 character",
        "string.max": "Video title must not exceed 200 characters",
    }),
    description: Joi.string().allow("").max(2000),
    visibility: Joi.string().valid("public", "private", "unlisted").messages({
        "any.only": "Visibility must be 'public', 'private', or 'unlisted'",
    }),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    linkedLessonId: Joi.string().hex().length(24).allow(null).messages({
        "string.hex": "linkedLessonId must be a valid ObjectId",
        "string.length": "linkedLessonId must be a valid ObjectId",
    }),
});

export const replaceVideoSchema = Joi.object({
    filename: Joi.string().required().trim().messages({
        "string.empty": "Filename is required",
        "any.required": "Filename is required",
    }),
    mimeType: Joi.string().required().pattern(/^video\//).messages({
        "string.empty": "MIME type is required",
        "string.pattern.base": "MIME type must be a video type (e.g., video/mp4)",
        "any.required": "MIME type is required",
    }),
    size: Joi.number().required().min(1).max(5 * 1024 * 1024 * 1024).messages({
        "number.base": "Size must be a number",
        "number.min": "Size must be greater than 0",
        "number.max": "Size must not exceed 5GB",
        "any.required": "Size is required",
    }),
});

export const videoQuerySchema = Joi.object({
    status: Joi.string().valid("uploading", "processing", "ready", "failed"),
    visibility: Joi.string().valid("public", "private", "unlisted"),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
});

export const adminVideoQuerySchema = Joi.object({
    uploaderId: Joi.string().hex().length(24),
    status: Joi.string().valid("uploading", "processing", "ready", "failed"),
    visibility: Joi.string().valid("public", "private", "unlisted"),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
});