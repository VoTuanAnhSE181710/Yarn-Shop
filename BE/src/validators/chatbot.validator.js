import Joi from "joi";
import { CHATBOT_ACTIONS } from "../utils/chatbot.js";

const sessionId = Joi.string()
  .trim()
  .min(8)
  .max(100)
  .pattern(/^[a-zA-Z0-9_-]+$/);

export const chatbotSessionSchema = Joi.object({
  sessionId: sessionId.optional(),
}).unknown(false);

export const chatbotMessageSchema = Joi.object({
  sessionId: sessionId.optional(),
  message: Joi.string().allow("").max(2000).default(""),
  action: Joi.string()
    .valid(...Object.values(CHATBOT_ACTIONS))
    .default(CHATBOT_ACTIONS.FREE_TEXT),
  answers: Joi.object().default({}),
}).unknown(false);

export const chatbotRecommendationSchema = Joi.object({
  level: Joi.string()
    .valid("beginner", "mid", "pro", "intermediate", "advanced", "unknown")
    .optional(),
  topic: Joi.string().trim().max(100).optional(),
  keyword: Joi.string().trim().max(200).optional(),
  maxDuration: Joi.number().integer().positive().allow(null).optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  recipient: Joi.string()
    .valid(
      "self",
      "beginner",
      "baby",
      "child",
      "pregnant",
      "elderly",
      "gift",
    )
    .optional(),
  project: Joi.string()
    .valid("scarf", "shirt", "hat", "blanket", "bag", "amigurumi")
    .allow(null)
    .optional(),
  material: Joi.string()
    .valid("soft", "cotton", "natural", "washable", "economical")
    .allow(null)
    .optional(),
  maxPrice: Joi.number().positive().allow(null).optional(),
  category: Joi.string()
    .valid("yarn", "hook", "needle", "accessory")
    .optional(),
  need: Joi.string()
    .valid("idea", "materials", "kit", "tutorial", "troubleshoot", "staff")
    .optional(),
  limit: Joi.number().integer().min(1).max(10).optional(),
}).unknown(false);

export const chatbotHandoffSchema = Joi.object({
  sessionId: sessionId.required(),
  reason: Joi.string().trim().max(500).allow("").optional(),
}).unknown(false);
