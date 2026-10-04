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
    if (!this.#model || !String(message || "").trim()) {
      return null;
    }

    const prompt = `
Bạn là bộ lập kế hoạch cho AI Agent của Yarn Shop.

Nhiệm vụ của bạn là đọc câu hỏi tự nhiên của khách hàng và chọn
MỘT hành động phù hợp để hệ thống backend thực hiện.

QUY TẮC QUAN TRỌNG:
- Chỉ chọn một hành động.
- Không tự tạo dữ liệu.
- Không tự tạo tên sản phẩm.
- Không tự tạo giá sản phẩm.
- Không tự tạo tồn kho.
- Không tự tạo thông tin đơn hàng.
- Không tự tạo địa chỉ.
- Không tự tạo thông tin liên hệ.
- Không tự tạo dữ liệu thanh toán.
- Khi cần dữ liệu hệ thống, hãy chọn action tương ứng để backend lấy dữ liệu thật.

CÁC HÀNH ĐỘNG ĐƯỢC PHÉP:

1. RECOMMEND_SHOP
   Dùng khi khách hàng muốn:
   - tìm sản phẩm
   - xem sản phẩm
   - hỏi sản phẩm
   - tìm sản phẩm theo loại, chất liệu, mục đích, đối tượng hoặc giá
   - yêu cầu một số lượng sản phẩm cụ thể

2. RECOMMEND_LEARN
   Dùng khi khách hàng muốn:
   - tìm khóa học
   - tìm video học
   - học crochet/móc len
   - tìm nội dung học theo trình độ hoặc chủ đề

3. RECOMMEND_DIY
   Dùng khi khách hàng muốn:
   - tìm kit DIY
   - tìm nội dung DIY
   - tìm bộ dụng cụ DIY
   - tìm DIY theo trình độ, dự án hoặc nhu cầu

4. VIEW_CART
   Dùng khi khách hàng muốn:
   - xem giỏ hàng
   - kiểm tra giỏ hàng
   - xem những sản phẩm đang có trong giỏ

5. QUOTE_SHIPPING
   Dùng khi khách hàng muốn:
   - tính phí vận chuyển
   - hỏi phí ship
   - báo giá giao hàng
   Chỉ sử dụng khi hệ thống đã có đủ thông tin cần thiết.

6. PREPARE_CHECKOUT
   Dùng khi khách hàng muốn:
   - chuẩn bị thanh toán
   - xem trước đơn hàng
   - chuẩn bị đặt hàng
   - kiểm tra tổng tiền trước khi tạo đơn

   Action này chỉ chuẩn bị bản xem trước.
   Không được tự tạo đơn hàng.

7. ADMIN_CONTACT
   Dùng khi khách hàng muốn:
   - liên hệ admin
   - hỏi thông tin liên hệ của shop/admin
   - cần hỗ trợ từ admin

8. GENERAL_CHAT
   Dùng cho các câu hỏi không thuộc các nhóm trên.

KHÔNG ĐƯỢC CHỌN:
- ADD_TO_CART
- REMOVE_FROM_CART
- SET_SHIPPING

Các thao tác thay đổi dữ liệu hoặc tạo đơn phải đi qua
payload có cấu trúc và bước xác nhận của khách hàng.

TRẠNG THÁI HIỆN TẠI CỦA AI AGENT:

${JSON.stringify({
  stage: state?.stage || null,
  cartCount: Array.isArray(state?.cart)
    ? state.cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      )
    : 0,
  shippingConfigured: Boolean(state?.shippingAddress),
})}

ĐỊNH DẠNG OUTPUT:

Chỉ trả về MỘT JSON object hợp lệ.

Format:

{
  "action": "GENERAL_CHAT",
  "payload": {},
  "reply": "mô tả ngắn bước tiếp theo"
}

Không thêm markdown.
Không thêm \`\`\`json.
Không thêm giải thích bên ngoài JSON.

QUY TẮC PAYLOAD:

RECOMMEND_SHOP có thể sử dụng:

{
  "recipient": "...",
  "project": "...",
  "material": "...",
  "maxPrice": 0,
  "category": "...",
  "keyword": "...",
  "limit": 1
}

Quy tắc:
- Chỉ truyền những field mà khách hàng thực sự cung cấp hoặc yêu cầu.
- Không tự suy đoán giá trị nếu khách hàng không nói.
- maxPrice phải là số.
- limit phải là số nguyên từ 1 đến 10.
- Chỉ truyền limit khi khách hàng yêu cầu số lượng cụ thể.
- Nếu khách hàng không yêu cầu số lượng thì không cần truyền limit.
- Nếu khách hàng nói "10 sản phẩm", "cho tôi 10 món", "xem 10 sản phẩm",
  hoặc cách diễn đạt tương đương thì đặt limit = 10.
- Nếu khách hàng yêu cầu số lượng lớn hơn 10 thì đặt limit = 10.
- Không tạo sản phẩm giả để đủ số lượng.
- Nếu database có ít sản phẩm hơn số lượng yêu cầu thì backend chỉ trả
  những sản phẩm thực tế đang có.

RECOMMEND_LEARN có thể sử dụng:

{
  "level": "...",
  "topic": "...",
  "keyword": "...",
  "maxDuration": 0,
  "minRating": 0
}

Quy tắc:
- Chỉ truyền field khách hàng thực sự yêu cầu.
- maxDuration và minRating phải là số khi được sử dụng.
- Không tự tạo khóa học hoặc video.

RECOMMEND_DIY có thể sử dụng:

{
  "level": "...",
  "project": "...",
  "need": "...",
  "maxPrice": 0,
  "keyword": "..."
}

Quy tắc:
- Chỉ truyền field khách hàng thực sự yêu cầu.
- maxPrice phải là số khi được sử dụng.
- Không tự tạo kit hoặc nội dung DIY.

VIEW_CART:
- Không cần payload.
- Backend sẽ lấy giỏ hàng thực tế.

QUOTE_SHIPPING:
- Chỉ sử dụng khi trạng thái hệ thống cho biết đã có đủ thông tin
  cần thiết để tính phí vận chuyển.
- Không tự tạo tọa độ hoặc địa chỉ.

PREPARE_CHECKOUT:
- Không tạo đơn hàng.
- Backend chỉ chuẩn bị bản xem trước dựa trên dữ liệu hệ thống.

ADMIN_CONTACT:
- Không tự tạo thông tin liên hệ.
- Backend sẽ lấy thông tin thực tế.

GENERAL_CHAT:
- payload phải là {} nếu không cần dữ liệu hệ thống.

VÍ DỤ:

Ví dụ 1:
Khách hàng:
"Tìm cho tôi 10 sản phẩm len"

Output:
{
  "action": "RECOMMEND_SHOP",
  "payload": {
    "material": "len",
    "limit": 10
  },
  "reply": "Tôi sẽ tìm các sản phẩm len hiện có trong hệ thống."
}

Ví dụ 2:
Khách hàng:
"Có sản phẩm nào dưới 200 nghìn không?"

Output:
{
  "action": "RECOMMEND_SHOP",
  "payload": {
    "maxPrice": 200000
  },
  "reply": "Tôi sẽ tìm các sản phẩm có giá không quá 200000 đồng."
}

Ví dụ 3:
Khách hàng:
"Cho tôi xem sản phẩm len cho trẻ em dưới 100k"

Output:
{
  "action": "RECOMMEND_SHOP",
  "payload": {
    "material": "len",
    "recipient": "trẻ em",
    "maxPrice": 100000
  },
  "reply": "Tôi sẽ tìm các sản phẩm phù hợp trong hệ thống."
}

Ví dụ 4:
Khách hàng:
"Xem giỏ hàng của tôi"

Output:
{
  "action": "VIEW_CART",
  "payload": {},
  "reply": "Tôi sẽ kiểm tra giỏ hàng hiện tại của bạn."
}

Ví dụ 5:
Khách hàng:
"Tôi muốn học crochet cho người mới"

Output:
{
  "action": "RECOMMEND_LEARN",
  "payload": {
    "level": "người mới",
    "topic": "crochet"
  },
  "reply": "Tôi sẽ tìm nội dung học phù hợp cho người mới."
}

Ví dụ 6:
Khách hàng:
"Có kit DIY nào cho người mới không?"

Output:
{
  "action": "RECOMMEND_DIY",
  "payload": {
    "level": "người mới"
  },
  "reply": "Tôi sẽ tìm các kit DIY phù hợp."
}

CÂU KHÁCH HÀNG:

${JSON.stringify(String(message).slice(0, 1200))}
`;

    try {
      const result = await this.#model.generateContent(prompt);

      const parsed = safeJsonFromText(result.response.text());

      if (!parsed || !PLANNER_ACTIONS.has(parsed.action)) {
        return null;
      }

      return {
        action: parsed.action,
        payload:
          parsed.payload && typeof parsed.payload === "object"
            ? parsed.payload
            : {},
        reply:
          typeof parsed.reply === "string"
            ? parsed.reply
            : null,
      };
    } catch (error) {
      console.warn(
        "Gemini AI Agent planner fallback:",
        error.message,
      );

      return null;
    }
  }
}