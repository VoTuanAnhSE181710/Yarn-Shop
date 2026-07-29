import { randomUUID } from "node:crypto";
import {
  BadRequestError,
  NotFoundError,
} from "../../../error/error.js";
import {
  AI_AGENT_ACTIONS,
  AI_AGENT_STAGES,
  CONFIRMATION_TTL_MS,
} from "../aiAgent.constants.js";

const PRODUCT_ID_PATTERN = /^[a-f\d]{24}$/i;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stateWith(state, changes) {
  return { ...clone(state), ...changes };
}

function cartSummary(cart = []) {
  const estimatedItemsPrice = cart.reduce(
    (total, item) => total + item.priceSnapshot * item.quantity,
    0,
  );
  return {
    items: clone(cart),
    itemCount: cart.reduce((total, item) => total + item.quantity, 0),
    estimatedItemsPrice,
    currency: "VND",
    notice: "Giá và tồn kho sẽ được Backend kiểm tra lại trước khi tạo đơn.",
  };
}

export default class AgentToolRegistry {
  constructor({
    aiAgentRepository,
    chatbotService,
    shippingService,
    orderService,
  }) {
    this.aiAgentRepository = aiAgentRepository;
    this.chatbotService = chatbotService;
    this.shippingService = shippingService;
    this.orderService = orderService;
  }

  async execute({ action, payload = {}, state, sessionId, userId }) {
    switch (action) {
      case AI_AGENT_ACTIONS.RECOMMEND_SHOP:
        return this.#recommendShop(payload, state);
      case AI_AGENT_ACTIONS.RECOMMEND_LEARN:
        return this.#recommendLearn(payload, state, userId);
      case AI_AGENT_ACTIONS.RECOMMEND_DIY:
        return this.#recommendDIY(payload, state);
      case AI_AGENT_ACTIONS.ADD_TO_CART:
        return this.#addToCart(payload, state, sessionId);
      case AI_AGENT_ACTIONS.REMOVE_FROM_CART:
        return this.#removeFromCart(payload, state, sessionId);
      case AI_AGENT_ACTIONS.VIEW_CART:
        return this.#viewCart(state);
      case AI_AGENT_ACTIONS.SET_SHIPPING:
        return this.#setShipping(payload, state, sessionId);
      case AI_AGENT_ACTIONS.QUOTE_SHIPPING:
        return this.#quoteShipping(state, sessionId);
      case AI_AGENT_ACTIONS.PREPARE_CHECKOUT:
        return this.#prepareCheckout(
          payload,
          state,
          sessionId,
          userId,
        );
      case AI_AGENT_ACTIONS.ADMIN_CONTACT:
        return this.#adminContact(state);
      default:
        throw new BadRequestError(`AI Agent action không hợp lệ: ${action}`);
    }
  }

  async buildCheckoutDraft(state) {
    if (!Array.isArray(state.cart) || state.cart.length === 0) {
      throw new BadRequestError("Giỏ hàng đang trống.");
    }
    if (!state.shippingAddress) {
      throw new BadRequestError("Bạn chưa cung cấp địa chỉ giao hàng.");
    }

    const orderItems = [];
    for (const cartItem of state.cart) {
      const product = await this.aiAgentRepository.findProductById(
        cartItem.productId,
      );
      if (!product || !product.isActive) {
        throw new BadRequestError(
          `Sản phẩm "${cartItem.name}" không còn được bán.`,
        );
      }
      const variant = (product.variants || []).find(
        (item) => String(item._id) === String(cartItem.variantId),
      );
      if (!variant) {
        throw new BadRequestError(
          `Phiên bản của sản phẩm "${cartItem.name}" không còn tồn tại.`,
        );
      }
      if (Number(variant.stock) < Number(cartItem.quantity)) {
        throw new BadRequestError(
          `Sản phẩm "${cartItem.name}" chỉ còn ${variant.stock} sản phẩm.`,
        );
      }
      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        color: variant.color,
        hexCode: variant.hexCode,
      });
    }

    const calculated =
      await this.orderService.calculateOrderTotal(orderItems);
    let shippingFee = calculated.shippingFee;
    let shippingQuote = null;

    const lat = Number(state.shippingAddress.lat);
    const lng = Number(state.shippingAddress.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      shippingQuote = await this.shippingService.calculateQuote({
        lat,
        lng,
        orderValue: calculated.itemsPrice,
      });
      if (!shippingQuote.serviceable) {
        throw new BadRequestError(
          shippingQuote.reason || "Địa chỉ nằm ngoài khu vực giao hàng.",
        );
      }
      shippingFee = shippingQuote.shippingFee;
    }

    return {
      items: calculated.validatedItems,
      itemsPrice: calculated.itemsPrice,
      shippingFee,
      totalPrice: calculated.itemsPrice + shippingFee,
      currency: "VND",
      shippingAddress: clone(state.shippingAddress),
      shippingQuote,
      paymentMethod: state.paymentMethod || "VNPAY",
    };
  }

  async #recommendShop(payload, state) {
    const results = await this.chatbotService.recommendShop(payload);
    return {
      reply: results.total
        ? `Agent tìm thấy ${results.total} sản phẩm phù hợp.`
        : "Chưa có sản phẩm phù hợp với bộ lọc.",
      results,
      state,
      nextActions: results.total
        ? [AI_AGENT_ACTIONS.ADD_TO_CART]
        : [AI_AGENT_ACTIONS.RECOMMEND_SHOP],
    };
  }

  async #recommendLearn(payload, state, userId) {
    const results = await this.chatbotService.recommendLearn(payload, userId);
    return {
      reply: results.total
        ? `Agent tìm thấy ${results.total} nội dung học phù hợp.`
        : "Chưa có nội dung học phù hợp.",
      results,
      state,
    };
  }

  async #recommendDIY(payload, state) {
    const results = await this.chatbotService.recommendDIY(payload);
    return {
      reply: results.total
        ? `Agent tìm thấy ${results.total} kit hoặc nội dung DIY phù hợp.`
        : "Chưa có kit hoặc nội dung DIY phù hợp.",
      results,
      state,
    };
  }

  async #addToCart(payload, state, sessionId) {
    const productId = String(payload.productId || "");
    const quantity = Number(payload.quantity || 1);
    if (!PRODUCT_ID_PATTERN.test(productId)) {
      throw new BadRequestError("productId không hợp lệ.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new BadRequestError("quantity phải là số nguyên từ 1 đến 99.");
    }

    const product = await this.aiAgentRepository.findProductById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Sản phẩm không tồn tại hoặc đã ngừng bán.");
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];
    let variant = null;
    if (payload.variantId) {
      variant = variants.find(
        (item) => String(item._id) === String(payload.variantId),
      );
    } else if (payload.color || payload.hexCode) {
      variant = variants.find(
        (item) =>
          (payload.color && item.color === payload.color) ||
          (payload.hexCode && item.hexCode === payload.hexCode),
      );
    } else if (variants.length === 1) {
      [variant] = variants;
    }

    if (!variant) {
      return {
        reply: "Hãy chọn một phiên bản trước khi thêm vào giỏ hàng.",
        results: {
          productId,
          productName: product.name,
          variants: variants.map((item) => ({
            variantId: String(item._id),
            color: item.color,
            hexCode: item.hexCode,
            size: item.size || null,
            price: item.price,
            stock: item.stock,
            image: item.image,
          })),
        },
        options: variants.map((item) => ({
          id: String(item._id),
          label: [item.color, item.size].filter(Boolean).join(" - "),
          action: AI_AGENT_ACTIONS.ADD_TO_CART,
          value: {
            productId,
            variantId: String(item._id),
            quantity,
          },
        })),
        state,
      };
    }

    const cart = clone(state.cart || []);
    const key = `${productId}:${variant._id}`;
    const existingIndex = cart.findIndex((item) => item.key === key);
    const nextQuantity =
      quantity + (existingIndex >= 0 ? cart[existingIndex].quantity : 0);
    if (Number(variant.stock) < nextQuantity) {
      throw new BadRequestError(
        `Sản phẩm "${product.name}" chỉ còn ${variant.stock} sản phẩm.`,
      );
    }

    const cartItem = {
      key,
      productId,
      variantId: String(variant._id),
      name: product.name,
      image: variant.image || product.image,
      color: variant.color,
      hexCode: variant.hexCode,
      size: variant.size || null,
      priceSnapshot: Number(variant.price),
      quantity: nextQuantity,
    };
    if (existingIndex >= 0) cart[existingIndex] = cartItem;
    else cart.push(cartItem);

    const nextState = stateWith(state, {
      stage: AI_AGENT_STAGES.CART_BUILDING,
      cart,
      quote: null,
      pendingAction: null,
    });
    await this.aiAgentRepository.updateState(sessionId, nextState);

    return {
      reply: `Đã thêm ${quantity} × ${product.name} vào giỏ hàng.`,
      results: { cart: cartSummary(cart) },
      state: nextState,
      nextActions: [
        AI_AGENT_ACTIONS.VIEW_CART,
        AI_AGENT_ACTIONS.SET_SHIPPING,
      ],
    };
  }

  async #removeFromCart(payload, state, sessionId) {
    const key = String(payload.key || "");
    const productId = String(payload.productId || "");
    const variantId = String(payload.variantId || "");
    const cart = (state.cart || []).filter((item) => {
      if (key) return item.key !== key;
      return !(
        item.productId === productId &&
        (!variantId || item.variantId === variantId)
      );
    });
    if (cart.length === (state.cart || []).length) {
      throw new NotFoundError("Không tìm thấy sản phẩm trong giỏ hàng.");
    }

    const nextState = stateWith(state, {
      stage: cart.length
        ? AI_AGENT_STAGES.CART_BUILDING
        : AI_AGENT_STAGES.DISCOVERY,
      cart,
      quote: null,
      pendingAction: null,
    });
    await this.aiAgentRepository.updateState(sessionId, nextState);
    return {
      reply: "Đã xóa sản phẩm khỏi giỏ hàng.",
      results: { cart: cartSummary(cart) },
      state: nextState,
    };
  }

  #viewCart(state) {
    return {
      reply: state.cart?.length
        ? `Giỏ hàng có ${state.cart.length} dòng sản phẩm.`
        : "Giỏ hàng đang trống.",
      results: { cart: cartSummary(state.cart || []) },
      state,
      nextActions: state.cart?.length
        ? [AI_AGENT_ACTIONS.SET_SHIPPING, AI_AGENT_ACTIONS.PREPARE_CHECKOUT]
        : [AI_AGENT_ACTIONS.RECOMMEND_SHOP],
    };
  }

  async #setShipping(payload, state, sessionId) {
    const fullName = String(payload.fullName || "").trim();
    const phone = String(payload.phone || "").trim();
    const address = String(
      payload.address || payload.detailAddress || "",
    ).trim();
    if (fullName.length < 2) {
      throw new BadRequestError("fullName phải có ít nhất 2 ký tự.");
    }
    if (!/^[+\d][\d\s.-]{7,19}$/.test(phone)) {
      throw new BadRequestError("Số điện thoại giao hàng không hợp lệ.");
    }
    if (address.length < 5) {
      throw new BadRequestError("Địa chỉ giao hàng quá ngắn.");
    }

    const shippingAddress = {
      fullName,
      phone,
      address,
      provinceId: payload.provinceId ?? null,
      districtId: payload.districtId ?? null,
      wardCode: payload.wardCode ?? null,
      lat:
        payload.lat === null || payload.lat === undefined
          ? null
          : Number(payload.lat),
      lng:
        payload.lng === null || payload.lng === undefined
          ? null
          : Number(payload.lng),
    };
    if (
      (shippingAddress.lat !== null &&
        (!Number.isFinite(shippingAddress.lat) ||
          shippingAddress.lat < -90 ||
          shippingAddress.lat > 90)) ||
      (shippingAddress.lng !== null &&
        (!Number.isFinite(shippingAddress.lng) ||
          shippingAddress.lng < -180 ||
          shippingAddress.lng > 180))
    ) {
      throw new BadRequestError("Tọa độ giao hàng không hợp lệ.");
    }

    const nextState = stateWith(state, {
      stage: AI_AGENT_STAGES.ADDRESS_SET,
      shippingAddress,
      quote: null,
      pendingAction: null,
    });
    await this.aiAgentRepository.updateState(sessionId, nextState);
    return {
      reply: "Đã lưu địa chỉ cho phiên đặt hàng này.",
      results: {
        shippingAddress: {
          fullName,
          phone,
          address,
          coordinatesConfigured:
            shippingAddress.lat !== null && shippingAddress.lng !== null,
        },
      },
      state: nextState,
      nextActions: [
        AI_AGENT_ACTIONS.QUOTE_SHIPPING,
        AI_AGENT_ACTIONS.PREPARE_CHECKOUT,
      ],
    };
  }

  async #quoteShipping(state, sessionId) {
    const draft = await this.buildCheckoutDraft(state);
    const nextState = stateWith(state, {
      quote: {
        itemsPrice: draft.itemsPrice,
        shippingFee: draft.shippingFee,
        totalPrice: draft.totalPrice,
        currency: draft.currency,
        estimatedDeliveryDays:
          draft.shippingQuote?.estimatedDeliveryDays || null,
      },
      pendingAction: null,
    });
    await this.aiAgentRepository.updateState(sessionId, nextState);
    return {
      reply: `Phí vận chuyển dự kiến là ${draft.shippingFee.toLocaleString("vi-VN")}đ.`,
      results: { quote: nextState.quote },
      state: nextState,
      nextActions: [AI_AGENT_ACTIONS.PREPARE_CHECKOUT],
    };
  }

  async #prepareCheckout(payload, state, sessionId, userId) {
    let workingState = clone(state);
    if (!Array.isArray(workingState.cart) || workingState.cart.length === 0) {
      const nextState = stateWith(workingState, {
        stage: AI_AGENT_STAGES.DISCOVERY,
      });
      await this.aiAgentRepository.updateState(sessionId, nextState);
      return {
        reply:
          "Giỏ hàng đang trống. Hãy chọn sản phẩm trước khi thanh toán.",
        results: { requiredStep: "ADD_PRODUCT" },
        state: nextState,
        nextActions: [AI_AGENT_ACTIONS.RECOMMEND_SHOP],
      };
    }
    if (!workingState.shippingAddress && userId) {
      const address = await this.aiAgentRepository.findDefaultAddress(userId);
      if (address) {
        workingState.shippingAddress = {
          fullName: address.fullName,
          phone: address.phone,
          address: [
            address.detailAddress,
            address.wardName,
            address.districtName,
            address.provinceName,
          ]
            .filter(Boolean)
            .join(", "),
          provinceId: address.provinceId,
          districtId: address.districtId,
          wardCode: address.wardCode,
          lat: address.lat,
          lng: address.lng,
        };
      }
    }
    if (!workingState.shippingAddress) {
      const nextState = stateWith(workingState, {
        stage: AI_AGENT_STAGES.ADDRESS_REQUIRED,
      });
      await this.aiAgentRepository.updateState(sessionId, nextState);
      return {
        reply: "Hãy cung cấp địa chỉ giao hàng trước khi thanh toán.",
        results: { requiredFields: ["fullName", "phone", "address"] },
        state: nextState,
        nextActions: [AI_AGENT_ACTIONS.SET_SHIPPING],
      };
    }

    const paymentMethod = String(
      payload.paymentMethod || workingState.paymentMethod || "VNPAY",
    ).toUpperCase();
    if (!["COD", "VNPAY"].includes(paymentMethod)) {
      throw new BadRequestError("paymentMethod phải là COD hoặc VNPAY.");
    }
    workingState.paymentMethod = paymentMethod;

    const draft = await this.buildCheckoutDraft(workingState);
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);
    const nextState = stateWith(workingState, {
      stage: AI_AGENT_STAGES.AWAITING_CONFIRMATION,
      quote: {
        itemsPrice: draft.itemsPrice,
        shippingFee: draft.shippingFee,
        totalPrice: draft.totalPrice,
        currency: draft.currency,
      },
      pendingAction: {
        type: "CREATE_ORDER",
        token,
        status: "PENDING",
        expiresAt,
      },
    });
    await this.aiAgentRepository.updateState(sessionId, nextState);

    return {
      reply:
        "Đơn hàng chưa được tạo. Hãy kiểm tra thông tin và xác nhận trong 15 phút.",
      results: {
        draft: {
          items: draft.items,
          itemsPrice: draft.itemsPrice,
          shippingFee: draft.shippingFee,
          totalPrice: draft.totalPrice,
          currency: draft.currency,
          shippingAddress: draft.shippingAddress,
          paymentMethod,
        },
      },
      confirmation: {
        required: true,
        token,
        expiresAt: expiresAt.toISOString(),
        endpoint: "/api/v1/ai-agent/confirm",
      },
      state: nextState,
    };
  }

  #adminContact(state) {
    const response = this.chatbotService.getAdminContact();
    return {
      reply: "Đây là thông tin liên hệ đã cấu hình của Yarn Shop.",
      results: response.data,
      state,
    };
  }
}
