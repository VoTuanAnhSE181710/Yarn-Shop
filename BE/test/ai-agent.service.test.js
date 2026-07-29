import test from "node:test";
import assert from "node:assert/strict";
import AiAgentService from "../src/modules/ai-agent/aiAgent.service.js";
import AgentToolRegistry from "../src/modules/ai-agent/tools/agentToolRegistry.js";
import {
  AI_AGENT_ACTIONS,
  createDefaultAgentState,
} from "../src/modules/ai-agent/aiAgent.constants.js";

const PRODUCT_ID = "6a687ba2a3588e3f5d774dbc";
const VARIANT_ID = "6a687ba2a3588e3f5d774dbd";

class FakeAiAgentRepository {
  constructor() {
    this.sessions = new Map();
    this.product = {
      _id: PRODUCT_ID,
      name: "Len Milk Cotton 125g",
      image: "product.jpg",
      isActive: true,
      variants: [
        {
          _id: VARIANT_ID,
          color: "Đỏ",
          hexCode: "#ff0000",
          size: "125g",
          price: 45000,
          stock: 20,
          image: "red.jpg",
        },
        {
          _id: "6a687ba2a3588e3f5d774dbe",
          color: "Trắng",
          hexCode: "#ffffff",
          size: "125g",
          price: 45000,
          stock: 20,
          image: "white.jpg",
        },
      ],
    };
  }

  findSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  createSession({ sessionId, userId }) {
    const session = {
      sessionId,
      userId: userId || null,
      agentState: createDefaultAgentState(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  attachUser(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId) return null;
    session.userId = userId;
    return session;
  }

  updateState(sessionId, state) {
    const session = this.sessions.get(sessionId);
    session.agentState = state;
    return session;
  }

  findProductById(productId) {
    return productId === PRODUCT_ID ? this.product : null;
  }

  findDefaultAddress() {
    return null;
  }

  claimConfirmation({ sessionId, token, now = new Date() }) {
    const session = this.sessions.get(sessionId);
    const pending = session?.agentState?.pendingAction;
    if (
      !pending ||
      pending.token !== token ||
      pending.status !== "PENDING" ||
      new Date(pending.expiresAt) <= now
    ) {
      return null;
    }
    pending.status = "PROCESSING";
    return session;
  }

  releaseConfirmation({ sessionId, token }) {
    const session = this.sessions.get(sessionId);
    const pending = session?.agentState?.pendingAction;
    if (pending?.token === token) pending.status = "PENDING";
    return session;
  }

  completeOrder({ sessionId, order }) {
    const session = this.sessions.get(sessionId);
    session.agentState = {
      ...session.agentState,
      stage: "ORDER_CREATED",
      cart: [],
      quote: null,
      pendingAction: null,
      lastOrder: order,
    };
    return session;
  }
}

function createAgent() {
  const aiAgentRepository = new FakeAiAgentRepository();
  const chatbotService = {
    recommendShop: async () => ({
      products: [{ id: PRODUCT_ID, name: "Len Milk Cotton 125g" }],
      total: 1,
    }),
    recommendLearn: async () => ({ courses: [], videos: [], total: 0 }),
    recommendDIY: async () => ({ kits: [], posts: [], total: 0 }),
    getAdminContact: () => ({
      status: "success",
      data: { contact: { configured: false } },
    }),
    handleMessage: async ({ sessionId }) => ({
      status: "success",
      data: {
        sessionId,
        action: "START",
        intent: "UNKNOWN",
        reply: "Fallback",
        options: [],
        results: null,
        meta: { source: "GUIDED_FALLBACK" },
      },
    }),
  };
  const shippingService = {
    calculateQuote: async ({ orderValue }) => ({
      serviceable: true,
      shippingFee: orderValue >= 500000 ? 0 : 15000,
      estimatedDeliveryDays: "1-2",
    }),
  };
  const orderService = {
    created: [],
    calculateOrderTotal: async (items) => {
      const itemsPrice = items.reduce(
        (total, item) => total + 45000 * item.quantity,
        0,
      );
      return {
        validatedItems: items.map((item) => ({
          product: item.productId,
          name: "Len Milk Cotton 125g",
          image: "red.jpg",
          price: 45000,
          quantity: item.quantity,
          variant: { color: item.color, hexCode: item.hexCode },
        })),
        itemsPrice,
        shippingFee: 30000,
        totalPrice: itemsPrice + 30000,
      };
    },
    createOrder: async function (data) {
      this.created.push(data);
      return {
        _id: "order-1",
        orderStatus: "PENDING",
        payment: data.payment,
      };
    },
  };
  const geminiPlanner = {
    configured: true,
    plan: async () => ({
      action: AI_AGENT_ACTIONS.RECOMMEND_SHOP,
      payload: { recipient: "beginner", maxPrice: 200000 },
      reply: "Tìm sản phẩm",
    }),
  };
  const agentToolRegistry = new AgentToolRegistry({
    aiAgentRepository,
    chatbotService,
    shippingService,
    orderService,
  });
  const service = new AiAgentService({
    aiAgentRepository,
    agentToolRegistry,
    geminiPlanner,
    chatbotService,
    orderService,
  });
  return { service, aiAgentRepository, orderService };
}

test("AI Agent health exposes Gemini tool mode", () => {
  const { service } = createAgent();
  const health = service.getHealth();

  assert.equal(health.data.service, "yarn-shop-ai-agent");
  assert.equal(health.data.mode, "HYBRID_TOOL_AGENT");
  assert.equal(health.data.confirmationRequiredForOrder, true);
});

test("AI Agent free text uses the planner and grounded shop tool", async () => {
  const { service } = createAgent();
  const response = await service.handleMessage({
    sessionId: "agent-session-001",
    message: "Tư vấn len cho người mới dưới 200000 đồng",
  });

  assert.equal(response.data.action, AI_AGENT_ACTIONS.RECOMMEND_SHOP);
  assert.equal(response.data.results.total, 1);
  assert.equal(response.data.meta.source, "GEMINI_TOOL_PLAN");
});

test("AI Agent requests a variant before adding a multi-variant product", async () => {
  const { service } = createAgent();
  const response = await service.handleMessage({
    sessionId: "agent-session-002",
    action: AI_AGENT_ACTIONS.ADD_TO_CART,
    payload: { productId: PRODUCT_ID, quantity: 2 },
  });

  assert.equal(response.data.options.length, 2);
  assert.equal(response.data.state.cartCount, 0);
});

test("AI Agent prepares and confirms a COD order exactly once", async () => {
  const { service, orderService } = createAgent();
  const sessionId = "agent-session-003";
  const userId = "user-1";

  await service.handleMessage({
    sessionId,
    userId,
    action: AI_AGENT_ACTIONS.ADD_TO_CART,
    payload: {
      productId: PRODUCT_ID,
      variantId: VARIANT_ID,
      quantity: 2,
      price: 1,
    },
  });
  await service.handleMessage({
    sessionId,
    userId,
    action: AI_AGENT_ACTIONS.SET_SHIPPING,
    payload: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "Xã Vĩnh Kim, tỉnh Đồng Tháp",
      lat: 10.357225,
      lng: 106.244531,
    },
  });
  const prepared = await service.handleMessage({
    sessionId,
    userId,
    action: AI_AGENT_ACTIONS.PREPARE_CHECKOUT,
    payload: { paymentMethod: "COD" },
  });

  assert.equal(prepared.data.confirmation.required, true);
  assert.equal(prepared.data.results.draft.shippingFee, 15000);
  assert.equal(prepared.data.results.draft.totalPrice, 105000);

  const confirmed = await service.confirmOrder({
    sessionId,
    confirmationToken: prepared.data.confirmation.token,
    userId,
    request: {},
  });
  assert.equal(confirmed.data.action, "ORDER_CREATED");
  assert.equal(confirmed.data.results.order.payUrl, null);
  assert.equal(orderService.created.length, 1);

  await assert.rejects(
    () =>
      service.confirmOrder({
        sessionId,
        confirmationToken: prepared.data.confirmation.token,
        userId,
        request: {},
      }),
    /không tồn tại|hết hạn|đã được xử lý/i,
  );
  assert.equal(orderService.created.length, 1);
});

test("AI Agent requires authentication again for an owned session", async () => {
  const { service } = createAgent();
  const sessionId = "agent-session-004";

  await service.createSession({ sessionId, userId: "user-1" });

  await assert.rejects(
    () =>
      service.handleMessage({
        sessionId,
        action: AI_AGENT_ACTIONS.VIEW_CART,
      }),
    /cần đăng nhập lại/,
  );
});

test("AI Agent rechecks the exact variant before checkout", async () => {
  const { service, aiAgentRepository } = createAgent();
  const sessionId = "agent-session-005";

  await service.handleMessage({
    sessionId,
    userId: "user-1",
    action: AI_AGENT_ACTIONS.ADD_TO_CART,
    payload: {
      productId: PRODUCT_ID,
      variantId: VARIANT_ID,
      quantity: 2,
    },
  });
  await service.handleMessage({
    sessionId,
    userId: "user-1",
    action: AI_AGENT_ACTIONS.SET_SHIPPING,
    payload: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "Xã Vĩnh Kim, tỉnh Đồng Tháp",
    },
  });
  aiAgentRepository.product.variants =
    aiAgentRepository.product.variants.filter(
      (variant) => variant._id !== VARIANT_ID,
    );

  await assert.rejects(
    () =>
      service.handleMessage({
        sessionId,
        userId: "user-1",
        action: AI_AGENT_ACTIONS.PREPARE_CHECKOUT,
        payload: { paymentMethod: "COD" },
      }),
    /không còn tồn tại/,
  );
});
