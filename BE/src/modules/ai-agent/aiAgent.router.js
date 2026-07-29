import express from "express";
import {
  AuthenticationError,
  TokenMissing,
} from "../../error/error.js";
import {
  authentication,
  checkPermission,
  validateData,
} from "../../api/middlewares/middleware.js";
import {
  aiAgentConfirmSchema,
  aiAgentMessageSchema,
  aiAgentSessionSchema,
} from "./aiAgent.validator.js";

const router = express.Router();

function optionalAuthentication(req, _res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) return next();

  try {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new TokenMissing("Bearer token không hợp lệ");
    }
    const tokenService = req.container.resolve("tokenService");
    req.user = tokenService.verifyAccessToken({ token });
    return next();
  } catch (error) {
    if (error?.statusCode) return next(error);
    return next(new AuthenticationError("Access Token không hợp lệ"));
  }
}

/**
 * @swagger
 * tags:
 *   - name: AI Agent
 *     description: Tool-using Yarn Shop agent with cart, shipping and confirmed checkout
 *
 * components:
 *   schemas:
 *     AiAgentMessageRequest:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           minLength: 8
 *           example: agent-session-001
 *         message:
 *           type: string
 *           example: Tư vấn len mềm cho người mới dưới 200000 đồng
 *         action:
 *           type: string
 *           enum:
 *             - FREE_TEXT
 *             - RECOMMEND_SHOP
 *             - RECOMMEND_LEARN
 *             - RECOMMEND_DIY
 *             - ADD_TO_CART
 *             - REMOVE_FROM_CART
 *             - VIEW_CART
 *             - SET_SHIPPING
 *             - QUOTE_SHIPPING
 *             - PREPARE_CHECKOUT
 *             - ADMIN_CONTACT
 *         payload:
 *           type: object
 *           additionalProperties: true
 *     AiAgentConfirmRequest:
 *       type: object
 *       required: [sessionId, confirmationToken]
 *       properties:
 *         sessionId:
 *           type: string
 *           example: agent-session-001
 *         confirmationToken:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /ai-agent/health:
 *   get:
 *     tags: [AI Agent]
 *     summary: Check AI Agent, Gemini planner and tool capabilities
 *     responses:
 *       200:
 *         description: AI Agent is available
 */
router.get("/health", async (req, res, next) => {
  const controller = req.container.resolve("aiAgentController");
  await controller.health(req, res, next);
});

/**
 * @swagger
 * /ai-agent/sessions:
 *   post:
 *     tags: [AI Agent]
 *     summary: Start an anonymous or authenticated AI Agent session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 minLength: 8
 *                 example: agent-session-001
 *     responses:
 *       201:
 *         description: Agent session created
 */
router.post(
  "/sessions",
  optionalAuthentication,
  validateData(aiAgentSessionSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("aiAgentController");
    await controller.createSession(req, res, next);
  },
);

/**
 * @swagger
 * /ai-agent/messages:
 *   post:
 *     tags: [AI Agent]
 *     summary: Send free text or execute a structured Agent tool
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AiAgentMessageRequest'
 *     responses:
 *       200:
 *         description: Agent response, tool result or checkout draft
 *       400:
 *         description: Invalid action data
 */
router.post(
  "/messages",
  optionalAuthentication,
  validateData(aiAgentMessageSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("aiAgentController");
    await controller.message(req, res, next);
  },
);

/**
 * @swagger
 * /ai-agent/confirm:
 *   post:
 *     tags: [AI Agent]
 *     summary: Confirm a pending checkout and create the order
 *     description: Requires login. Prices and stock are recalculated by Backend.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AiAgentConfirmRequest'
 *     responses:
 *       201:
 *         description: Order created; VNPay URL returned for VNPay orders
 *       401:
 *         description: Login required
 *       409:
 *         description: Confirmation expired or already used
 */
router.post(
  "/confirm",
  authentication,
  checkPermission("Order", "create"),
  validateData(aiAgentConfirmSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("aiAgentController");
    await controller.confirm(req, res, next);
  },
);

export default router;
