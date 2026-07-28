import express from "express";
import {
  AuthenticationError,
  TokenMissing,
} from "../../error/error.js";
import {
  chatbotHandoffSchema,
  chatbotMessageSchema,
  chatbotRecommendationSchema,
  chatbotSessionSchema,
} from "../../validators/chatbot.validator.js";
import { validateData } from "../middlewares/middleware.js";

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
 *   - name: Chatbot
 *     description: Guided customer chatbot with optional Gemini intent routing
 *
 * components:
 *   schemas:
 *     ChatbotOption:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         label:
 *           type: string
 *         action:
 *           type: string
 *         value:
 *           nullable: true
 *     ChatbotMessageRequest:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *         message:
 *           type: string
 *         action:
 *           type: string
 *           example: FREE_TEXT
 *         answers:
 *           type: object
 */

/**
 * @swagger
 * /chatbot/health:
 *   get:
 *     tags: [Chatbot]
 *     summary: Check chatbot mode and Gemini configuration
 *     responses:
 *       200:
 *         description: Chatbot is available
 */
router.get("/health", async (req, res, next) => {
  const controller = req.container.resolve("chatbotController");
  await controller.health(req, res, next);
});

/**
 * @swagger
 * /chatbot/menu:
 *   get:
 *     tags: [Chatbot]
 *     summary: Get the customer menu and select-based flow definitions
 *     responses:
 *       200:
 *         description: Menu and Learn/Shop/DIY flow definitions
 */
router.get("/menu", async (req, res, next) => {
  const controller = req.container.resolve("chatbotController");
  await controller.menu(req, res, next);
});

/**
 * @swagger
 * /chatbot/sessions:
 *   post:
 *     tags: [Chatbot]
 *     summary: Start an anonymous or authenticated chatbot session
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
 *     responses:
 *       201:
 *         description: Session created
 */
router.post(
  "/sessions",
  optionalAuthentication,
  validateData(chatbotSessionSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("chatbotController");
    await controller.createSession(req, res, next);
  },
);

/**
 * @swagger
 * /chatbot/messages:
 *   post:
 *     tags: [Chatbot]
 *     summary: Send free text or a guided chatbot action
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatbotMessageRequest'
 *     responses:
 *       200:
 *         description: Chatbot response with options, flow, or grounded results
 */
router.post(
  "/messages",
  optionalAuthentication,
  validateData(chatbotMessageSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("chatbotController");
    await controller.message(req, res, next);
  },
);

router.post(
  "/recommendations/learn",
  optionalAuthentication,
  validateData(chatbotRecommendationSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("chatbotController");
    await controller.recommendLearn(req, res, next);
  },
);

router.post(
  "/recommendations/shop",
  validateData(chatbotRecommendationSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("chatbotController");
    await controller.recommendShop(req, res, next);
  },
);

router.post(
  "/recommendations/diy",
  validateData(chatbotRecommendationSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("chatbotController");
    await controller.recommendDIY(req, res, next);
  },
);

router.get("/admin-contact", async (req, res, next) => {
  const controller = req.container.resolve("chatbotController");
  await controller.adminContact(req, res, next);
});

router.post(
  "/handoff",
  optionalAuthentication,
  validateData(chatbotHandoffSchema),
  async (req, res, next) => {
    const controller = req.container.resolve("chatbotController");
    await controller.handoff(req, res, next);
  },
);

export default router;
