import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeJsonFromText } from "../../../utils/chatbot.js";
import {
  AI_AGENT_ACTIONS,
  PLANNER_ACTIONS,
} from "../aiAgent.constants.js";

export default class GeminiPlanner {
  #model = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.#model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      });
    }
  }

  get configured() {
    return Boolean(this.#model);
  }

  async plan({ message, state }) {
    if (!this.#model || !String(message || "").trim()) return null;

    const prompt = `
Bạn là bộ lập kế hoạch cho AI Agent của Yarn Shop.
Chỉ chọn một hành động an toàn. Không tự tạo giá, tồn kho, sản phẩm,
địa chỉ, thông tin liên hệ hoặc dữ liệu thanh toán.

Hành động được phép:
- RECOMMEND_SHOP: tìm sản phẩm
- RECOMMEND_LEARN: tìm khóa học/video
- RECOMMEND_DIY: tìm kit/nội dung DIY
- VIEW_CART: xem giỏ hàng hiện tại
- QUOTE_SHIPPING: tính phí vận chuyển khi đã có giỏ và tọa độ
- PREPARE_CHECKOUT: chuẩn bị bản xem trước đơn hàng, chưa tạo đơn
- ADMIN_CONTACT: lấy thông tin liên hệ admin
- GENERAL_CHAT: các câu hỏi khác

Không chọn ADD_TO_CART, SET_SHIPPING hoặc tạo đơn từ câu tự do. Các thao tác
đó phải đi qua payload có cấu trúc và bước xác nhận của khách hàng.

Trạng thái không nhạy cảm:
${JSON.stringify({
  stage: state.stage,
  cartCount: state.cart.length,
  shippingConfigured: Boolean(state.shippingAddress),
})}

Trả về JSON duy nhất:
{"action":"GENERAL_CHAT","payload":{},"reply":"mô tả ngắn bước tiếp theo"}

Với RECOMMEND_SHOP, payload chỉ dùng các field:
recipient, project, material, maxPrice, category, keyword.
Với RECOMMEND_LEARN: level, topic, keyword, maxDuration, minRating.
Với RECOMMEND_DIY: level, project, need, maxPrice, keyword.

Câu khách hàng: ${JSON.stringify(String(message).slice(0, 1200))}
`;

    try {
      const result = await this.#model.generateContent(prompt);
      const parsed = safeJsonFromText(result.response.text());
      if (!parsed || !PLANNER_ACTIONS.has(parsed.action)) return null;
      return {
        action: parsed.action,
        payload:
          parsed.payload && typeof parsed.payload === "object"
            ? parsed.payload
            : {},
        reply: typeof parsed.reply === "string" ? parsed.reply : null,
      };
    } catch (error) {
      console.warn("Gemini AI Agent planner fallback:", error.message);
      return null;
    }
  }
}
