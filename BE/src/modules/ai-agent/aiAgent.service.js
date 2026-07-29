import { randomUUID } from "node:crypto";
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../../error/error.js";
import { CHATBOT_ACTIONS } from "../../utils/chatbot.js";
import { generateVNPayUrl } from "../../utils/vnpayHelper.js";
import {
  AI_AGENT_ACTIONS,
  AI_AGENT_CAPABILITIES,
  createDefaultAgentState,
} from "./aiAgent.constants.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(value) {
  const raw =
    value && typeof value.toObject === "function" ? value.toObject() : value;
  return {
    ...createDefaultAgentState(),
    ...(raw ? clone(raw) : {}),
    cart: Array.isArray(raw?.cart) ? clone(raw.cart) : [],
  };
}

function publicState(state) {
  return {
    stage: state.stage,
    cartCount: (state.cart || []).reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    ),
    shippingConfigured: Boolean(state.shippingAddress),
    paymentMethod: state.paymentMethod,
    quote: state.quote || null,
    pendingConfirmation: state.pendingAction?.status === "PENDING",
    lastOrder: state.lastOrder || null,
  };
}

function agentResponse({
  sessionId,
  action,
  reply,
  state,
  results = null,
  options = [],
  nextActions = [],
  confirmation = null,
  meta = {},
}) {
  return {
    status: "success",
    data: {
      sessionId,
      action,
      reply,
      options,
      nextActions,
      results,
      confirmation,
      state: publicState(state),
      meta: {
        service: "yarn-shop-ai-agent",
        requiresExplicitConfirmation: true,
        ...meta,
      },
    },
  };
}

export default class AiAgentService {
  constructor({
    aiAgentRepository,
    agentToolRegistry,
    geminiPlanner,
    chatbotService,
    orderService,
  }) {
    this.aiAgentRepository = aiAgentRepository;
    this.agentToolRegistry = agentToolRegistry;
    this.geminiPlanner = geminiPlanner;
    this.chatbotService = chatbotService;
    this.orderService = orderService;
  }

  getHealth() {
    return {
      status: "success",
      data: {
        service: "yarn-shop-ai-agent",
        mode: this.geminiPlanner.configured
          ? "HYBRID_TOOL_AGENT"
          : "DETERMINISTIC_TOOL_AGENT",
        geminiConfigured: this.geminiPlanner.configured,
        confirmationRequiredForOrder: true,
        capabilities: Object.values(AI_AGENT_ACTIONS).filter(
          (action) =>
            ![
              AI_AGENT_ACTIONS.FREE_TEXT,
              AI_AGENT_ACTIONS.GENERAL_CHAT,
            ].includes(action),
        ),
        timestamp: new Date().toISOString(),
      },
    };
  }

  async createSession({ sessionId, userId } = {}) {
    const ensured = await this.#ensureSession({ sessionId, userId });
    return agentResponse({
      sessionId: ensured.sessionId,
      action: "START",
      reply:
        "Xin chào! AI Agent có thể tư vấn, chuẩn bị giỏ hàng, tính phí giao hàng và tạo đơn sau khi bạn xác nhận.",
      options: clone(AI_AGENT_CAPABILITIES),
      state: ensured.state,
      meta: {
        planner: this.geminiPlanner.configured ? "GEMINI" : "FALLBACK",
        authenticated: Boolean(userId),
      },
    });
  }

  async handleMessage({
    sessionId,
    userId,
    message = "",
    action = AI_AGENT_ACTIONS.FREE_TEXT,
    payload = {},
  }) {
    const ensured = await this.#ensureSession({ sessionId, userId });
    const resolvedAction = String(
      action || AI_AGENT_ACTIONS.FREE_TEXT,
    ).toUpperCase();

    if (
      resolvedAction === AI_AGENT_ACTIONS.FREE_TEXT ||
      resolvedAction === AI_AGENT_ACTIONS.GENERAL_CHAT
    ) {
      return this.#handleFreeText({
        sessionId: ensured.sessionId,
        userId,
        message,
        state: ensured.state,
      });
    }

    const toolResult = await this.agentToolRegistry.execute({
      action: resolvedAction,
      payload,
      state: ensured.state,
      sessionId: ensured.sessionId,
      userId,
    });
    return agentResponse({
      sessionId: ensured.sessionId,
      action: resolvedAction,
      ...toolResult,
      meta: { source: "EXPLICIT_TOOL_ACTION" },
    });
  }

  async confirmOrder({ sessionId, confirmationToken, userId, request }) {
    if (!userId) {
      throw new AuthorizationError(
        "Bạn phải đăng nhập trước khi xác nhận tạo đơn.",
      );
    }

    const ensured = await this.#ensureSession({ sessionId, userId });
    if (
      ensured.state.paymentMethod === "VNPAY" &&
      !this.#vnpayConfigured()
    ) {
      throw new BadRequestError(
        "VNPay chưa được cấu hình. Hãy chọn COD hoặc cấu hình VNPay.",
      );
    }

    const claimed = await this.aiAgentRepository.claimConfirmation({
      sessionId: ensured.sessionId,
      token: confirmationToken,
    });
    if (!claimed) {
      throw new ConflictError(
        "Yêu cầu xác nhận không tồn tại, đã hết hạn hoặc đã được xử lý.",
      );
    }

    try {
      const state = normalizeState(claimed.agentState);
      const draft = await this.agentToolRegistry.buildCheckoutDraft(state);
      const order = await this.orderService.createOrder({
        user: userId,
        items: draft.items,
        shippingAddress: draft.shippingAddress,
        itemsPrice: draft.itemsPrice,
        shippingFee: draft.shippingFee,
        totalPrice: draft.totalPrice,
        payment: {
          method: draft.paymentMethod,
          status: "PENDING",
        },
      });

      const payUrl =
        draft.paymentMethod === "VNPAY"
          ? generateVNPayUrl(String(order._id), draft.totalPrice, request)
          : null;
      const orderSummary = {
        orderId: String(order._id),
        orderStatus: order.orderStatus,
        paymentMethod: draft.paymentMethod,
        paymentStatus: order.payment?.status || "PENDING",
        totalPrice: draft.totalPrice,
        currency: "VND",
        payUrl,
      };
      const completed = await this.aiAgentRepository.completeOrder({
        sessionId: ensured.sessionId,
        order: orderSummary,
      });

      return agentResponse({
        sessionId: ensured.sessionId,
        action: "ORDER_CREATED",
        reply:
          draft.paymentMethod === "VNPAY"
            ? "Đơn hàng đã được tạo. Hãy mở đường dẫn VNPay để thanh toán."
            : "Đơn hàng COD đã được tạo thành công.",
        results: { order: orderSummary },
        state: normalizeState(completed?.agentState),
        meta: {
          source: "CONFIRMED_TRANSACTION",
          authenticated: true,
        },
      });
    } catch (error) {
      await this.aiAgentRepository
        .releaseConfirmation({
          sessionId: ensured.sessionId,
          token: confirmationToken,
        })
        .catch(() => {});
      throw error;
    }
  }

  async #handleFreeText({ sessionId, userId, message, state }) {
    if (!String(message || "").trim()) {
      return agentResponse({
        sessionId,
        action: "START",
        reply: "Hãy nhập câu hỏi hoặc chọn một chức năng.",
        options: clone(AI_AGENT_CAPABILITIES),
        state,
      });
    }

    const plan = await this.geminiPlanner.plan({ message, state });
    if (plan && plan.action !== AI_AGENT_ACTIONS.GENERAL_CHAT) {
      const toolResult = await this.agentToolRegistry.execute({
        action: plan.action,
        payload: plan.payload,
        state,
        sessionId,
        userId,
      });
      return agentResponse({
        sessionId,
        action: plan.action,
        ...toolResult,
        meta: {
          source: "GEMINI_TOOL_PLAN",
          plannerReply: plan.reply,
        },
      });
    }

    const chatbot = await this.chatbotService.handleMessage({
      sessionId,
      userId,
      message,
      action: CHATBOT_ACTIONS.FREE_TEXT,
    });
    return agentResponse({
      sessionId,
      action: chatbot.data.action || AI_AGENT_ACTIONS.GENERAL_CHAT,
      reply: chatbot.data.reply,
      options: chatbot.data.options || [],
      results: chatbot.data.results || null,
      state,
      meta: {
        source: chatbot.data.meta?.source || "CHATBOT_FALLBACK",
        chatbotIntent: chatbot.data.intent,
        flow: chatbot.data.flow || null,
      },
    });
  }

  async #ensureSession({ sessionId, userId }) {
    const resolvedId = sessionId || randomUUID();
    let session = await this.aiAgentRepository.findSession(resolvedId);
    if (!session) {
      session = await this.aiAgentRepository.createSession({
        sessionId: resolvedId,
        userId,
      });
    } else {
      const ownerId = session.userId ? String(session.userId) : null;
      if (ownerId && ownerId !== String(userId || "")) {
        throw new ForbiddenError(
          "Phiên AI Agent thuộc về một tài khoản khác hoặc cần đăng nhập lại.",
        );
      }
      if (!ownerId && userId) {
        session =
          (await this.aiAgentRepository.attachUser(resolvedId, userId)) ||
          session;
      }
    }

    let state = normalizeState(session.agentState);
    if (!session.agentState) {
      await this.aiAgentRepository.updateState(resolvedId, state);
    }
    return { sessionId: resolvedId, session, state };
  }

  #vnpayConfigured() {
    return Boolean(
      process.env.VNP_TMN_CODE &&
        process.env.VNP_HASH_SECRET &&
        process.env.VNP_URL &&
        process.env.VNP_RETURN_URL,
    );
  }
}
