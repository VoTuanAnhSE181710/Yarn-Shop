export const AI_AGENT_ACTIONS = Object.freeze({
  FREE_TEXT: "FREE_TEXT",
  RECOMMEND_SHOP: "RECOMMEND_SHOP",
  RECOMMEND_LEARN: "RECOMMEND_LEARN",
  RECOMMEND_DIY: "RECOMMEND_DIY",
  ADD_TO_CART: "ADD_TO_CART",
  REMOVE_FROM_CART: "REMOVE_FROM_CART",
  VIEW_CART: "VIEW_CART",
  SET_SHIPPING: "SET_SHIPPING",
  QUOTE_SHIPPING: "QUOTE_SHIPPING",
  PREPARE_CHECKOUT: "PREPARE_CHECKOUT",
  ADMIN_CONTACT: "ADMIN_CONTACT",
  GENERAL_CHAT: "GENERAL_CHAT",
});

export const AI_AGENT_STAGES = Object.freeze({
  DISCOVERY: "DISCOVERY",
  CART_BUILDING: "CART_BUILDING",
  ADDRESS_REQUIRED: "ADDRESS_REQUIRED",
  ADDRESS_SET: "ADDRESS_SET",
  AWAITING_CONFIRMATION: "AWAITING_CONFIRMATION",
  ORDER_CREATED: "ORDER_CREATED",
});

export const PLANNER_ACTIONS = new Set([
  AI_AGENT_ACTIONS.RECOMMEND_SHOP,
  AI_AGENT_ACTIONS.RECOMMEND_LEARN,
  AI_AGENT_ACTIONS.RECOMMEND_DIY,
  AI_AGENT_ACTIONS.VIEW_CART,
  AI_AGENT_ACTIONS.QUOTE_SHIPPING,
  AI_AGENT_ACTIONS.PREPARE_CHECKOUT,
  AI_AGENT_ACTIONS.ADMIN_CONTACT,
  AI_AGENT_ACTIONS.GENERAL_CHAT,
]);
export const CONFIRMATION_TTL_MS = 15 * 60 * 1000;

export function createDefaultAgentState() {
  return {
    stage: AI_AGENT_STAGES.DISCOVERY,
    cart: [],
    shippingAddress: null,
    paymentMethod: "VNPAY",
    quote: null,
    pendingAction: null,
    lastOrder: null,
  };
}

export const AI_AGENT_CAPABILITIES = Object.freeze([
  {
    id: "recommend-shop",
    label: "Tư vấn sản phẩm",
    action: AI_AGENT_ACTIONS.RECOMMEND_SHOP,
  },
  {
    id: "recommend-learn",
    label: "Tư vấn nội dung học",
    action: AI_AGENT_ACTIONS.RECOMMEND_LEARN,
  },
  {
    id: "recommend-diy",
    label: "Tư vấn DIY",
    action: AI_AGENT_ACTIONS.RECOMMEND_DIY,
  },
  {
    id: "view-cart",
    label: "Xem giỏ hàng",
    action: AI_AGENT_ACTIONS.VIEW_CART,
  },
  {
    id: "checkout",
    label: "Chuẩn bị thanh toán",
    action: AI_AGENT_ACTIONS.PREPARE_CHECKOUT,
  },
]);
