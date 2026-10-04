import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExternalServiceError, NotFoundError } from "../error/error.js";
import { safeJsonFromText } from "../utils/chatbot.js";

const MAX_PRODUCTS = 10;
const PRODUCT_ID_PATTERN = /^[a-f\d]{24}$/i;
const PRODUCT_CATEGORIES = new Set(["yarn", "hook", "needle", "accessory"]);

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(message) {
  const normalized = String(message)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const match = normalized.match(
    /(?:duoi|toi da|khong qua|re hon|under|below|budget)\s*([\d.,]+(?:\s+[\d.,]+)?)\s*(trieu|tr|k|nghin|ngan)?/,
  );
  if (!match) return null;

  const amountText = match[1].replace(/\s/g, "");
  const numericAmount = /^\d{1,3}(?:[.,]\d{3})+$/.test(amountText)
    ? amountText.replace(/[.,]/g, "")
    : amountText.replace(",", ".");
  let amount = Number(numericAmount);
  if (match[2] === "trieu" || match[2] === "tr") amount *= 1_000_000;
  else if (["k", "nghin", "ngan"].includes(match[2])) amount *= 1_000;
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}

function parseLimit(message) {
  const normalized = normalizeText(message);
  const match =
    normalized.match(/\b(\d{1,2})\s*(?:san pham|mon hang|mon|loai)\b/) ||
    normalized.match(/(?:liet ke|ke toi|cho toi xem|xem)\s*(\d{1,2})\b/);
  return match ? Math.min(MAX_PRODUCTS, Math.max(1, Number(match[1]))) : 5;
}

function parseSearch(message) {
  const normalized = normalizeText(message);
  const knownTerms = [
    "milk cotton",
    "cotton",
    "acrylic",
    "wool",
    "crochet",
    "kim moc",
    "kim dan",
    "phu kien",
  ];
  const knownMatch = knownTerms.find((term) => normalized.includes(term));
  if (knownMatch) return knownMatch;

  const stopWords = new Set([
    "co",
    "san",
    "pham",
    "nao",
    "ten",
    "thuoc",
    "danh",
    "muc",
    "cho",
    "toi",
    "xem",
    "ke",
    "liet",
    "hay",
    "gi",
    "duoi",
    "toi",
    "da",
    "khong",
    "qua",
    "re",
    "hon",
    "cac",
    "nhung",
    "mot",
    "loai",
    "sanpham",
    "len",
    "soi",
    "yarn",
    "hook",
    "needle",
    "accessory",
    "dong",
    "đong",
    "vnd",
    "kim",
    "moc",
    "dan",
  ]);
  const terms = normalized
    .replace(/(?:duoi|toi da|khong qua|re hon)\s+[\d\s.,]+(?:trieu|tr|k|nghin|ngan)?/g, " ")
    .split(" ")
    .filter((term) => term && !stopWords.has(term) && !/^\d+$/.test(term));
  return terms.slice(-2).join(" ");
}

function parseCategory(message) {
  const normalized = normalizeText(message);
  if (/\b(yarn|len|soi)\b/.test(normalized)) return "yarn";
  if (/\b(hook|kim moc)\b/.test(normalized)) return "hook";
  if (/\b(needle|kim dan)\b/.test(normalized)) return "needle";
  if (/\b(accessory|phu kien)\b/.test(normalized)) return "accessory";
  return "";
}

function parseDetailIndex(message) {
  const normalized = normalizeText(message);
  if (/\b(dau tien|dau|first|cai nay|san pham nay|mon nay|cai do|mon do)\b/.test(normalized)) {
    return 0;
  }
  const ordinal = normalized.match(/\b(?:cai|san pham|mon)\s+thu\s+(\d{1,2})\b/);
  return ordinal ? Number(ordinal[1]) - 1 : null;
}

function isDetailFollowUp(message) {
  const normalized = normalizeText(message);
  return /\b(gia|bao nhieu|ton kho|con hang|con khong|mau|kich thuoc|chi tiet|detail|stock|price)\b/.test(
    normalized,
  );
}

function sanitizeProduct(product, maxPrice) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const filteredVariants =
    maxPrice === null
      ? variants
      : variants.filter((variant) => Number(variant.price) <= maxPrice);

  return {
    id: String(product._id || product.id),
    name: product.name,
    category: product.category,
    image: product.image,
    variants: filteredVariants.map((variant) => ({
      color: variant.color,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
    })),
  };
}

function productLabel(product) {
  const prices = product.variants
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);
  if (!prices.length) return product.name;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceLabel =
    minPrice === maxPrice
      ? `${minPrice.toLocaleString("vi-VN")}đ`
      : `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
  return `${product.name} – ${priceLabel}`;
}

export default class ProductChatService {
  #productService;
  #model = null;

  constructor({ productService }, options = {}) {
    this.#productService = productService;
    if (Object.prototype.hasOwnProperty.call(options, "aiModel")) {
      this.#model = options.aiModel || null;
    } else if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.#model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      });
    }
  }

  async sendMessage({ message, conversationId, contextProductIds = [] }) {
    const text = String(message || "").trim();
    const contextIds = [...new Set(contextProductIds)]
      .filter((id) => PRODUCT_ID_PATTERN.test(String(id)))
      .slice(0, MAX_PRODUCTS);

    let contextProducts = [];
    try {
      contextProducts = (
        await Promise.all(
          contextIds.map(async (id) => {
            try {
              const product = await this.#productService.getProductById(id);
              return product?.isActive === false ? null : product;
            } catch (error) {
              if (error instanceof NotFoundError || error.statusCode === 404) {
                return null;
              }
              throw error;
            }
          }),
        )
      ).filter(Boolean);
    } catch (error) {
      console.error("Product chat context lookup failed:", error.message);
      throw new ExternalServiceError("PRODUCT_DATA_UNAVAILABLE");
    }

    const interpreted = await this.#interpret(text, contextProducts);
    if (interpreted.intent === "product_detail") {
      return this.#detailResponse({
        conversationId,
        message: text,
        products: contextProducts,
        productIndex: interpreted.productIndex,
      });
    }

    if (interpreted.intent !== "product_search") {
      return {
        status: "success",
        data: {
          conversationId: conversationId || null,
          reply:
            "Xin chào! Tôi có thể giúp bạn tìm sản phẩm theo tên, danh mục hoặc giá.",
          products: [],
          contextProductIds: contextProducts.map((product) =>
            String(product._id || product.id),
          ),
        },
      };
    }

    const filters = this.#safeFilters(interpreted, text);
    let result;
    try {
      result = await this.#productService.getProducts({
        search: filters.search || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice ?? undefined,
        maxPrice: filters.maxPrice ?? undefined,
        page: 1,
        limit: filters.limit,
        sort: "newest",
      });
    } catch (error) {
      console.error("Product chat product search failed:", error.message);
      throw new ExternalServiceError("PRODUCT_DATA_UNAVAILABLE");
    }

    const products = (result.products || [])
      .filter((product) => product.isActive !== false)
      .map((product) => sanitizeProduct(product, filters.maxPrice));
    const reply = products.length
      ? `Đây là ${products.length} sản phẩm hiện có theo dữ liệu cửa hàng:\n${products
          .map((product, index) => `${index + 1}. ${productLabel(product)}`)
          .join("\n")}`
      : "Tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn.";

    return {
      status: "success",
      data: {
        conversationId: conversationId || null,
        reply,
        products,
        contextProductIds: products.map((product) => product.id),
      },
    };
  }

  async #interpret(message, contextProducts) {
    const fallback = this.#fallbackIntent(message, contextProducts);
    if (!this.#model) return fallback;

    const prompt = `Bạn phân tích ý định hỏi đáp của khách Yarn Shop.
Chỉ trả một JSON hợp lệ, không thêm markdown:
{"intent":"product_search|product_detail|general","limit":5,"search":"","category":"","minPrice":null,"maxPrice":null,"productIndex":null}
Quy tắc:
- Chọn product_search khi người dùng muốn liệt kê/tìm sản phẩm theo tên, chất liệu, danh mục hoặc giá.
- Chọn product_detail khi hỏi tiếp về giá, tồn kho, màu hoặc chi tiết của sản phẩm trong danh sách hội thoại.
- Chọn general nếu không cần dữ liệu sản phẩm.
- Không suy đoán điều kiện người dùng không yêu cầu; limit phải từ 1 đến 10.
- productIndex bắt đầu từ 0. Bối cảnh sản phẩm (id và tên) theo thứ tự: ${JSON.stringify(
      contextProducts.map((product) => ({
        id: String(product._id || product.id),
        name: product.name,
      })),
    )}
Câu hỏi: ${JSON.stringify(message.slice(0, 1000))}`;

    try {
      const response = await this.#model.generateContent(prompt);
      const parsed = safeJsonFromText(response.response.text());
      if (!parsed || !["product_search", "product_detail", "general"].includes(parsed.intent)) {
        return fallback;
      }
      return {
        ...fallback,
        ...parsed,
        intent: fallback.intent === "general" ? parsed.intent : fallback.intent,
      };
    } catch (error) {
      console.error("Product chat AI provider failed:", error.message);
      throw new ExternalServiceError("AI_PROVIDER_UNAVAILABLE");
    }
  }

  #fallbackIntent(message, contextProducts) {
    const normalized = normalizeText(message);
    const productIntent =
      /\b(san pham|len|soi|cotton|kim moc|kim dan|gia|ton kho|con hang|danh muc|product|stock|price)\b/.test(
        normalized,
      ) || /\b\d{1,2}\s*(?:mon|loai)\b/.test(normalized);
    const productIndex = parseDetailIndex(message);
    const explicitReference =
      /\b(san pham nay|cai nay|mon nay|cai do|mon do|dau tien|thu nhat)\b/.test(
        normalized,
      );

    if (
      (contextProducts.length || explicitReference) &&
      (productIndex !== null ||
        (productIntent && isDetailFollowUp(message)) ||
        explicitReference)
    ) {
      return {
        intent: "product_detail",
        productIndex: productIndex ?? 0,
      };
    }
    if (productIntent) {
      return { intent: "product_search" };
    }
    return { intent: "general" };
  }

  #safeFilters(interpreted, message) {
    const category = PRODUCT_CATEGORIES.has(interpreted.category)
      ? interpreted.category
      : parseCategory(message);
    const search =
      typeof interpreted.search === "string" && interpreted.search.trim()
        ? interpreted.search.trim().slice(0, 100)
        : parseSearch(message);
    const minPrice =
      interpreted.minPrice !== null &&
      interpreted.minPrice !== undefined &&
      Number.isFinite(Number(interpreted.minPrice))
      ? Number(interpreted.minPrice)
      : null;
    const parsedMaxPrice = Number(interpreted.maxPrice);
    const maxPrice =
      interpreted.maxPrice !== null && Number.isFinite(parsedMaxPrice)
        ? parsedMaxPrice
        : parsePrice(message);
    const requestedLimit = Number(interpreted.limit);
    const limit =
      interpreted.limit !== null &&
      interpreted.limit !== undefined &&
      Number.isFinite(requestedLimit)
      ? Math.min(MAX_PRODUCTS, Math.max(1, Math.floor(requestedLimit)))
      : parseLimit(message);

    return { category, search, minPrice, maxPrice, limit };
  }

  #detailResponse({ conversationId, message, products, productIndex }) {
    const index = Number.isInteger(Number(productIndex))
      ? Number(productIndex)
      : parseDetailIndex(message) ?? 0;
    const rawProduct = products[index];
    if (!rawProduct) {
      return {
        status: "success",
        data: {
          conversationId: conversationId || null,
          reply: products.length
            ? "Tôi chưa xác định được sản phẩm bạn muốn hỏi. Bạn có thể nêu tên sản phẩm."
            : "Bạn đang hỏi sản phẩm nào? Hãy tìm sản phẩm trước, rồi tôi có thể kiểm tra thông tin hiện có.",
          products: [],
          contextProductIds: products.map((product) =>
            String(product._id || product.id),
          ),
        },
      };
    }

    const product = sanitizeProduct(rawProduct, null);
    const asksStock = /\b(ton kho|con hang|con khong|stock)\b/.test(
      normalizeText(message),
    );
    const hasStock = product.variants.some(
      (variant) => typeof variant.stock === "number" && Number.isFinite(variant.stock),
    );
    const reply = asksStock
      ? hasStock
        ? `Thông tin tồn kho của ${product.name} theo từng phiên bản được hiển thị bên dưới, dựa trên dữ liệu cửa hàng.`
        : `Hệ thống hiện không cung cấp thông tin tồn kho của ${product.name}.`
      : `Thông tin giá của ${product.name} theo từng phiên bản được hiển thị bên dưới, dựa trên dữ liệu cửa hàng.`;

    return {
      status: "success",
      data: {
        conversationId: conversationId || null,
        reply,
        products: [product],
        contextProductIds: [product.id],
      },
    };
  }
}
