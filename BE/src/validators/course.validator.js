import Joi from "joi";

export const createCourseSchema = Joi.object({
    title: Joi.string().required().trim().min(1).max(200).messages({
        "string.empty": "Course title is required",
        "string.min": "Course title must be at least 1 character",
        "string.max": "Course title must not exceed 200 characters",
    }),
    description: Joi.string().allow("").max(5000).messages({
        "string.max": "Description must not exceed 5000 characters",
    }),
    thumbnail: Joi.string().uri().allow(null, "").default(null).messages({
        "string.uri": "Thumbnail must be a valid URI",
    }),
    level: Joi.string().valid("beginner", "mid", "pro").required().messages({
        "any.only": "Level must be 'beginner', 'mid', or 'pro'",
        "any.required": "Level is required",
    }),
    linkedLessons: Joi.array().items(Joi.string().hex().length(24)).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    linkedCombo: Joi.array().items(Joi.string().hex().length(24)).optional(),
    isPublished: Joi.boolean().default(false),
});

export const updateCourseSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).messages({
        "string.min": "Course title must be at least 1 character",
        "string.max": "Course title must not exceed 200 characters",
    }),
    description: Joi.string().allow("").max(5000),
    thumbnail: Joi.string().uri().allow(null, ""),
    level: Joi.string().valid("beginner", "mid", "pro"),
    linkedLessons: Joi.array().items(Joi.string().hex().length(24)).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    linkedCombo: Joi.array().items(Joi.string().hex().length(24)).optional(),
    isPublished: Joi.boolean(),
});

export const courseQuerySchema = Joi.object({
    level: Joi.string().valid("beginner", "mid", "pro"),
    tag: Joi.string().trim(),
    creatorId: Joi.string().hex().length(24),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sort: Joi.string().valid("newest", "oldest", "rating", "enrolled").default("newest"),
});