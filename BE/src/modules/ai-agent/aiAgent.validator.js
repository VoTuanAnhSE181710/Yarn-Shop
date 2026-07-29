import Joi from "joi";
import { AI_AGENT_ACTIONS } from "./aiAgent.constants.js";

const sessionId = Joi.string()
  .trim()
  .min(8)
  .max(100)
  .pattern(/^[a-zA-Z0-9_-]+$/);

export const aiAgentSessionSchema = Joi.object({
  sessionId: sessionId.optional(),
}).unknown(false);
export const aiAgentMessageSchema = Joi.object({
  sessionId: sessionId.optional(),
  message: Joi.string().allow("").max(2000).default(""),
  action: Joi.string()
    .valid(...Object.values(AI_AGENT_ACTIONS))
    .default(AI_AGENT_ACTIONS.FREE_TEXT),
  payload: Joi.object().default({}).unknown(true),
}).unknown(false);

export const aiAgentConfirmSchema = Joi.object({
  sessionId: sessionId.required(),
  confirmationToken: Joi.string().guid({ version: "uuidv4" }).required(),
}).unknown(false);
