import JoiBase from "joi";
import mongoose from "mongoose";

const Joi = JoiBase;

const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "id must be a valid MongoDB ObjectId",
  });

const variantSchema = Joi.object({
  color: Joi.string().trim().required().messages({
    "any.required": "Variant color is required",
    "string.empty": "Variant color cannot be empty",
  }),
  hexCode: Joi.string()
    .trim()
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .required()
    .messages({
      "any.required": "Variant hexCode is required",
      "string.empty": "Variant hexCode cannot be empty",
      "string.pattern.base":
        "Variant hexCode must be a valid hex color (e.g. #FFF or #FF0000)",
    }),
  price: Joi.number().min(0).required().messages({
    "any.required": "Variant price is required",
    "number.base": "Variant price must be a number",
    "number.min": "Variant price cannot be negative",
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Variant stock must be a number",
    "number.integer": "Variant stock must be an integer",
    "number.min": "Variant stock cannot be negative",
  }),
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Product name is required",
    "string.empty": "Product name cannot be empty",
  }),
  description: Joi.string().trim().required().messages({
    "any.required": "Product description is required",
    "string.empty": "Product description cannot be empty",
  }),
  category: Joi.string()
    .valid("yarn", "hook", "kit", "accessory", "tool")
    .required()
    .messages({
      "any.required": "Product category is required",
      "any.only": "Category must be one of: yarn, hook, kit, accessory, tool",
    }),
  image: Joi.string().trim().required().messages({
    "any.required": "Product image is required",
    "string.empty": "Product image cannot be empty",
  }),
  images: Joi.array().items(Joi.string().trim()).default([]),
  tags: Joi.array().items(Joi.string().trim()).default([]),
  variants: Joi.array().items(variantSchema).min(1).required().messages({
    "any.required": "At least one variant is required",
    "array.min": "At least one variant is required",
  }),
  isActive: Joi.boolean().default(true),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    "string.empty": "Product name cannot be empty",
  }),
  description: Joi.string().trim().optional().messages({
    "string.empty": "Product description cannot be empty",
  }),
  category: Joi.string()
    .valid("yarn", "hook", "kit", "accessory", "tool")
    .optional()
    .messages({
      "any.only": "Category must be one of: yarn, hook, kit, accessory, tool",
    }),
  image: Joi.string().trim().optional().messages({
    "string.empty": "Product image cannot be empty",
  }),
  images: Joi.array().items(Joi.string().trim()).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  variants: Joi.array().items(variantSchema).min(1).optional().messages({
    "array.min": "At least one variant is required",
  }),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

const productQuerySchema = Joi.object({
  category: Joi.string()
    .valid("yarn", "hook", "kit", "accessory", "tool")
    .optional()
    .messages({
      "any.only": "Category must be one of: yarn, hook, kit, accessory, tool",
    }),
  tag: Joi.string().trim().optional(),
  search: Joi.string().trim().optional().allow(""),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort: Joi.string()
    .valid("newest", "oldest", "name_asc", "name_desc")
    .default("newest")
    .optional()
    .messages({
      "any.only": "Sort must be one of: newest, oldest, name_asc, name_desc",
    }),
  includeInactive: Joi.boolean().optional(),
});

const productIdParamSchema = Joi.object({
  id: objectId.required(),
});

export {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdParamSchema,
};
