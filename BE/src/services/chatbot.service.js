import { randomUUID } from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BadRequestError, NotFoundError } from "../error/error.js";
import {
  CHATBOT_ACTIONS,
  CHATBOT_FLOWS,
  MAIN_MENU,
  WEB_GUIDES,
  cloneConfig,
  extractAnswersFromMessage,
  formatDuration,
  inferIntent,
  safeJsonFromText,
  scoreProduct,
} from "../utils/chatbot.js";

const TOPIC_KEYWORDS = {
  basic: "cơ bản",
  scarf: "khăn",
  shirt: "áo",
  amigurumi: "thú len",
  bag: "túi",
  hat: "mũ",
  blanket: "chăn",
};

const ALLOWED_AI_ACTIONS = new Set([
  CHATBOT_ACTIONS.LEARN_START,
  CHATBOT_ACTIONS.SHOP_START,
  CHATBOT_ACTIONS.DIY_START,
  CHATBOT_ACTIONS.GUIDE_START,
  CHATBOT_ACTIONS.ORDER_SUPPORT,
  CHATBOT_ACTIONS.ADMIN_CONTACT,
  CHATBOT_ACTIONS.HANDOFF,
  CHATBOT_ACTIONS.START,
]);

function chatbotResponse({
  sessionId = null,
  intent,
  reply,
  action = null,
  options = [],
  flow = null,
  results = null,
  meta = {},
}) {
  return {
    status: "success",
    data: {
      sessionId,
      intent,
      action,
      reply,
      options,
      flow,
      results,
      meta: {
        source: "YARN_SHOP",
        canHandoff: true,
        ...meta,
      },
    },
  };
}

function configuredContact() {
  const channels = [
    process.env.ADMIN_EMAIL
      ? {
          type: "email",
          label: "Gửi email",
          value: process.env.ADMIN_EMAIL,
          href: `mailto:${process.env.ADMIN_EMAIL}`,
        }
      : null,
    process.env.ADMIN_PHONE
      ? {
          type: "phone",
          label: "Gọi điện",
          value: process.env.ADMIN_PHONE,
          href: `tel:${process.env.ADMIN_PHONE}`,
        }
      : null,
    process.env.ADMIN_ZALO_URL
      ? {
          type: "zalo",
          label: "Zalo",
          value: process.env.ADMIN_ZALO_URL,
          href: process.env.ADMIN_ZALO_URL,
        }
      : null,
    process.env.ADMIN_FACEBOOK_URL
      ? {
          type: "facebook",
          label: "Facebook",
          value: process.env.ADMIN_FACEBOOK_URL,
          href: process.env.ADMIN_FACEBOOK_URL,
        }
      : null,
  ].filter(Boolean);

  return {
    name: process.env.ADMIN_NAME || "Yarn Shop Support",
    workingHours:
      process.env.ADMIN_WORKING_HOURS || "Chưa cấu hình giờ làm việc",
    expectedResponse:
      process.env.ADMIN_RESPONSE_TIME || "Trong giờ làm việc",
    channels,
    configured: channels.length > 0,
  };
}

export default class ChatbotService {
  #chatbotRepository;
  #geminiModel = null;

  constructor({ chatbotRepository }) {
    this.#chatbotRepository = chatbotRepository;

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.#geminiModel = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      });
    }
  }

  getHealth() {
    return {
      status: "success",
      data: {
        service: "yarn-shop-chatbot",
        mode: this.#geminiModel ? "HYBRID_AI" : "GUIDED_FALLBACK",
        geminiConfigured: Boolean(this.#geminiModel),
        timestamp: new Date().toISOString(),
      },
    };
  }

  getMenu() {
    return {
      status: "success",
      data: {
        greeting:
          "Xin chào! Mình là trợ lý Yarn Shop. Bạn muốn được hỗ trợ vấn đề nào?",
        options: cloneConfig(MAIN_MENU),
        flows: cloneConfig(CHATBOT_FLOWS),
      },
    };
  }

  async createSession({ sessionId, userId } = {}) {
    const resolvedId = sessionId || randomUUID();
    let session = await this.#chatbotRepository.findSession(resolvedId);
    if (!session) {
      session = await this.#chatbotRepository.createSession({
        sessionId: resolvedId,
        userId,
      });
    }

    return chatbotResponse({
      sessionId: resolvedId,
      intent: "WELCOME",
      action: CHATBOT_ACTIONS.START,
      reply:
        "Xin chào! Mình là trợ lý Yarn Shop. Bạn muốn được hỗ trợ vấn đề nào?",
      options: cloneConfig(MAIN_MENU),
      meta: { sessionStatus: session.status },
    });
  }

  async recommendLearn(answers = {}, userId = null) {
    const level = answers.level === "unknown" ? null : answers.level;
    const keyword =
      answers.keyword || TOPIC_KEYWORDS[answers.topic] || answers.topic || null;
    const limit = Math.min(10, Math.max(1, Number(answers.limit) || 5));

    const learning = await this.#chatbotRepository.findLearning({
      level,
      keyword,
      maxDuration: answers.maxDuration,
      minRating: answers.minRating,
      limit,
      userId,
    });

    const courses = learning.courses.map((course) => ({
      id: String(course._id),
      type: "course",
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      level: course.level,
      duration: formatDuration(course.totalDuration),
      durationSeconds: course.totalDuration || 0,
      averageRating: course.averageRating || 0,
      totalRatings: course.totalRatings || 0,
      enrolledCount: course.enrolledCount || 0,
      enrolled: Boolean(course.enrolled),
      deepLink: `/learn?course=${course._id}`,
      availableActions: [
        {
          id: course.enrolled ? "continue" : "enroll",
          label: course.enrolled ? "Tiếp tục học" : "Đăng ký học",
          method: course.enrolled ? "GET" : "POST",
          endpoint: course.enrolled
            ? `/api/v1/courses/${course._id}`
            : `/api/v1/courses/${course._id}/enroll`,
          requiresAuth: true,
        },
        {
          id: "rate",
          label: "Đánh giá khóa học",
          method: "POST",
          endpoint: `/api/v1/courses/${course._id}/rate`,
          requiresAuth: true,
        },
      ],
      reason:
        course.level === level
          ? "Phù hợp với trình độ bạn đã chọn."
          : "Được đánh giá tốt và phù hợp với nội dung tìm kiếm.",
    }));

    const videos = learning.videos.map((video) => ({
      id: String(video._id),
      type: "video",
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail?.url || null,
      duration: formatDuration(video.duration),
      durationSeconds: video.duration || 0,
      averageRating: video.averageRating || 0,
      viewCount: video.viewCount || 0,
      deepLink: `/learn?video=${video._id}`,
      availableActions: [
        {
          id: "watch",
          label: "Xem video",
          method: "GET",
          endpoint: `/api/v1/videos/${video._id}`,
          requiresAuth: false,
        },
        {
          id: "rate",
          label: "Đánh giá video",
          method: "POST",
          endpoint: `/api/v1/videos/${video._id}/rate`,
          requiresAuth: true,
        },
      ],
      reason: answers.maxDuration
        ? "Có thời lượng nằm trong lựa chọn của bạn."
        : "Có nội dung liên quan và được cộng đồng quan tâm.",
    }));

    return {
      courses,
      videos,
      total: courses.length + videos.length,
      filters: {
        level,
        keyword,
        maxDuration: answers.maxDuration || null,
      },
    };
  }

  async recommendShop(answers = {}) {
    const limit = Math.min(10, Math.max(1, Number(answers.limit) || 5));
    const keyword = answers.keyword || null;
    const products = await this.#chatbotRepository.findProducts({
      category: answers.category,
      keyword,
      limit: 100,
    });

    let ranked = products
      .map((product) => ({
        product,
        ranking: scoreProduct(product, answers),
      }))
      .filter(({ ranking }) => ranking.totalStock > 0);

    if (answers.maxPrice) {
      ranked = ranked.filter(
        ({ ranking }) =>
          ranking.minPrice !== null &&
          ranking.minPrice <= Number(answers.maxPrice),
      );
    }

    ranked.sort((a, b) => b.ranking.score - a.ranking.score);

    const results = ranked.slice(0, limit).map(({ product, ranking }) => ({
      id: String(product._id),
      type: "product",
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
      tags: product.tags || [],
      minPrice: ranking.minPrice,
      maxPrice: ranking.maxPrice,
      totalStock: ranking.totalStock,
      averageRating: product.averageRating || 0,
      totalRatings: product.totalRatings || 0,
      score: ranking.score,
      reasons:
        ranking.reasons.length > 0
          ? ranking.reasons
          : ["phù hợp nhất trong các sản phẩm hiện có"],
      deepLink: `/product/${product._id}`,
      availableActions: [
        {
          id: "view",
          label: "Xem chi tiết",
          method: "GET",
          endpoint: `/api/v1/products/${product._id}`,
          requiresAuth: false,
        },
        {
          id: "rate",
          label: "Đánh giá sản phẩm",
          method: "POST",
          endpoint: `/api/v1/products/${product._id}/rate`,
          requiresAuth: true,
        },
      ],
    }));

    const sensitiveRecipient = ["baby", "pregnant"].includes(
      answers.recipient,
    );

    return {
      products: results,
      total: results.length,
      filters: {
        recipient: answers.recipient || null,
        project: answers.project || null,
        material: answers.material || null,
        maxPrice: answers.maxPrice || null,
      },
      safetyNotice: sensitiveRecipient
        ? "Gợi ý dựa trên mô tả và tag sản phẩm. Hãy kiểm tra nhãn chất liệu, hướng dẫn sử dụng và tiền sử dị ứng; chatbot không đưa ra tư vấn y tế."
        : null,
    };
  }

  async recommendDIY(answers = {}) {
    const keyword =
      answers.keyword || TOPIC_KEYWORDS[answers.project] || answers.need || null;
    const limit = Math.min(10, Math.max(1, Number(answers.limit) || 5));
    const diy = await this.#chatbotRepository.findDIY({
      keyword,
      level: answers.level,
      maxPrice: answers.maxPrice,
      limit,
    });

    return {
      kits: diy.kits.map((kit) => ({
        id: String(kit._id),
        type: "kit",
        title: kit.name,
        description: kit.description,
        thumbnail: kit.thumbnail,
        level: kit.level,
        price: kit.price,
        averageRating: kit.averageRating || 0,
        totalRatings: kit.totalRatings || 0,
        deepLink: `/kits?kit=${kit._id}`,
        reason: "Kit tập hợp sẵn sản phẩm cần thiết cho dự án DIY.",
      })),
      posts: diy.posts.map((post) => ({
        id: String(post._id),
        type: "diy-post",
        title: post.title,
        description: post.description,
        images: post.images || [],
        tags: post.tags || [],
        averageRating: post.averageRating || 0,
        totalRatings: post.totalRatings || 0,
        likeCount: post.likeCount || 0,
        deepLink: `/community?post=${post._id}`,
        reason: "Bài DIY có nội dung liên quan đến lựa chọn của bạn.",
      })),
      total: diy.kits.length + diy.posts.length,
      filters: {
        need: answers.need || null,
        level: answers.level || null,
        keyword,
      },
    };
  }

  getGuide(topic) {
    if (!topic) {
      return {
        topics: Object.entries(WEB_GUIDES).map(([id, guide]) => ({
          id,
          label: guide.title,
          action: CHATBOT_ACTIONS.GUIDE_SHOW,
          value: id,
        })),
      };
    }
    const guide = WEB_GUIDES[topic];
    if (!guide) throw new NotFoundError("Không tìm thấy hướng dẫn này");
    return { topic, ...cloneConfig(guide) };
  }

  getAdminContact() {
    return {
      status: "success",
      data: {
        contact: configuredContact(),
      },
    };
  }

  async requestHandoff({ sessionId, reason, userId }) {
    const { sessionId: resolvedId } = await this.#ensureSession({
      sessionId,
      userId,
    });
    await this.#chatbotRepository.markHandoff({
      sessionId: resolvedId,
      reason,
    });

    const contact = configuredContact();
    const reply = contact.configured
      ? "Mình đã ghi nhận yêu cầu gặp nhân viên. Bạn có thể dùng kênh liên hệ bên dưới."
      : "Mình đã ghi nhận yêu cầu gặp nhân viên. Admin cần cấu hình email hoặc số điện thoại hỗ trợ.";

    const response = chatbotResponse({
      sessionId: resolvedId,
      intent: "HANDOFF",
      action: CHATBOT_ACTIONS.HANDOFF,
      reply,
      results: { contact },
      meta: { sessionStatus: "HANDOFF" },
    });

    await this.#persistAssistantOnly(resolvedId, response);
    return response;
  }

  async handleMessage({
    sessionId,
    userId,
    message = "",
    action = CHATBOT_ACTIONS.FREE_TEXT,
    answers = {},
  }) {
    const { sessionId: resolvedId } = await this.#ensureSession({
      sessionId,
      userId,
    });
    const normalizedAction = String(action || CHATBOT_ACTIONS.FREE_TEXT).toUpperCase();

    let response;
    switch (normalizedAction) {
      case CHATBOT_ACTIONS.START:
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "WELCOME",
          action: CHATBOT_ACTIONS.START,
          reply:
            "Xin chào! Mình là trợ lý Yarn Shop. Bạn muốn được hỗ trợ vấn đề nào?",
          options: cloneConfig(MAIN_MENU),
        });
        break;
      case CHATBOT_ACTIONS.LEARN_START:
        response = this.#flowResponse(
          resolvedId,
          "LEARN",
          "Hãy chọn trình độ, nội dung và thời lượng mong muốn.",
          "learn",
        );
        break;
      case CHATBOT_ACTIONS.SHOP_START:
        response = this.#flowResponse(
          resolvedId,
          "SHOP",
          "Mình sẽ hỏi vài lựa chọn để tìm sản phẩm phù hợp nhất.",
          "shop",
        );
        break;
      case CHATBOT_ACTIONS.DIY_START:
        response = this.#flowResponse(
          resolvedId,
          "DIY",
          "Hãy chọn nhu cầu, trình độ và sản phẩm bạn muốn làm.",
          "diy",
        );
        break;
      case CHATBOT_ACTIONS.LEARN_RECOMMEND: {
        const results = await this.recommendLearn(answers, userId);
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "LEARN",
          action: CHATBOT_ACTIONS.LEARN_RECOMMEND,
          reply: results.total
            ? `Mình tìm thấy ${results.total} nội dung học phù hợp.`
            : "Chưa có nội dung học khớp lựa chọn. Bạn có thể bỏ bớt một bộ lọc.",
          results,
        });
        break;
      }
      case CHATBOT_ACTIONS.SHOP_RECOMMEND: {
        const results = await this.recommendShop(answers);
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "SHOP",
          action: CHATBOT_ACTIONS.SHOP_RECOMMEND,
          reply: results.total
            ? `Mình đã chọn ${results.total} sản phẩm phù hợp nhất từ dữ liệu cửa hàng.`
            : "Hiện không có sản phẩm còn hàng phù hợp. Hãy tăng ngân sách hoặc bỏ bớt bộ lọc.",
          results,
        });
        break;
      }
      case CHATBOT_ACTIONS.DIY_RECOMMEND: {
        if (answers.need === "staff") {
          return this.requestHandoff({
            sessionId: resolvedId,
            reason: "Customer requested DIY staff support",
            userId,
          });
        }
        const results = await this.recommendDIY(answers);
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "DIY",
          action: CHATBOT_ACTIONS.DIY_RECOMMEND,
          reply: results.total
            ? `Mình tìm thấy ${results.total} kit hoặc bài DIY liên quan.`
            : "Chưa có kit hoặc bài DIY phù hợp. Bạn có thể gửi yêu cầu cho nhân viên.",
          results,
          options: results.total
            ? []
            : [
                {
                  id: "diy-handoff",
                  label: "Gặp nhân viên",
                  action: CHATBOT_ACTIONS.HANDOFF,
                },
              ],
        });
        break;
      }
      case CHATBOT_ACTIONS.GUIDE_START: {
        const guide = this.getGuide();
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "GUIDE",
          action: CHATBOT_ACTIONS.GUIDE_START,
          reply: "Bạn muốn xem hướng dẫn cho thao tác nào?",
          options: guide.topics,
        });
        break;
      }
      case CHATBOT_ACTIONS.GUIDE_SHOW: {
        const topic = answers.topic || answers.value;
        const guide = this.getGuide(topic);
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "GUIDE",
          action: CHATBOT_ACTIONS.GUIDE_SHOW,
          reply: guide.title,
          results: { guide },
        });
        break;
      }
      case CHATBOT_ACTIONS.ORDER_SUPPORT: {
        const guide = this.getGuide("order");
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "ORDER",
          action: CHATBOT_ACTIONS.ORDER_SUPPORT,
          reply:
            "Mình có thể hướng dẫn kiểm tra đơn, thanh toán lại, hủy đơn và theo dõi hoàn tiền.",
          results: { guide },
          options: [
            {
              id: "order-human",
              label: "Gặp nhân viên",
              action: CHATBOT_ACTIONS.HANDOFF,
            },
          ],
        });
        break;
      }
      case CHATBOT_ACTIONS.ADMIN_CONTACT: {
        const contact = configuredContact();
        response = chatbotResponse({
          sessionId: resolvedId,
          intent: "ADMIN",
          action: CHATBOT_ACTIONS.ADMIN_CONTACT,
          reply: contact.configured
            ? "Đây là các kênh liên hệ chính thức của Yarn Shop."
            : "Admin chưa cấu hình kênh liên hệ trong môi trường backend.",
          results: { contact },
        });
        break;
      }
      case CHATBOT_ACTIONS.HANDOFF:
        return this.requestHandoff({
          sessionId: resolvedId,
          reason: answers.reason || message,
          userId,
        });
      case CHATBOT_ACTIONS.FREE_TEXT:
        response = await this.#handleFreeText({
          sessionId: resolvedId,
          userId,
          message,
        });
        break;
      default:
        throw new BadRequestError(`Chatbot action không hợp lệ: ${action}`);
    }

    await this.#persistInteraction({
      sessionId: resolvedId,
      message,
      action: normalizedAction,
      answers,
      response,
    });
    return response;
  }

  #flowResponse(sessionId, intent, reply, flowId) {
    return chatbotResponse({
      sessionId,
      intent,
      action: `${intent}_START`,
      reply,
      flow: cloneConfig(CHATBOT_FLOWS[flowId]),
    });
  }

  async #handleFreeText({ sessionId, userId, message }) {
    if (!String(message).trim()) {
      return chatbotResponse({
        sessionId,
        intent: "WELCOME",
        action: CHATBOT_ACTIONS.START,
        reply: "Bạn hãy chọn một mục hoặc nhập câu hỏi.",
        options: cloneConfig(MAIN_MENU),
      });
    }

    const detected = inferIntent(message);
    const answers = extractAnswersFromMessage(message);

    if (detected.intent === "SHOP" && Object.keys(answers).length) {
      const results = await this.recommendShop(answers);
      return chatbotResponse({
        sessionId,
        intent: "SHOP",
        action: CHATBOT_ACTIONS.SHOP_RECOMMEND,
        reply: results.total
          ? `Mình tìm thấy ${results.total} sản phẩm phù hợp từ dữ liệu cửa hàng.`
          : "Chưa có sản phẩm khớp câu hỏi. Bạn có thể dùng bộ chọn để mô tả rõ hơn.",
        results,
        flow: results.total ? null : cloneConfig(CHATBOT_FLOWS.shop),
        meta: { intentConfidence: detected.confidence },
      });
    }

    if (detected.intent === "LEARN") {
      const results = await this.recommendLearn(answers, userId);
      return chatbotResponse({
        sessionId,
        intent: "LEARN",
        action: CHATBOT_ACTIONS.LEARN_RECOMMEND,
        reply: results.total
          ? `Mình tìm thấy ${results.total} nội dung học liên quan.`
          : "Bạn hãy dùng bộ chọn để chọn trình độ và thời lượng.",
        results,
        flow: results.total ? null : cloneConfig(CHATBOT_FLOWS.learn),
        meta: { intentConfidence: detected.confidence },
      });
    }

    if (detected.intent === "DIY") {
      const results = await this.recommendDIY(answers);
      return chatbotResponse({
        sessionId,
        intent: "DIY",
        action: CHATBOT_ACTIONS.DIY_RECOMMEND,
        reply: results.total
          ? `Mình tìm thấy ${results.total} nội dung DIY liên quan.`
          : "Bạn hãy dùng bộ chọn DIY hoặc yêu cầu gặp nhân viên.",
        results,
        flow: results.total ? null : cloneConfig(CHATBOT_FLOWS.diy),
        meta: { intentConfidence: detected.confidence },
      });
    }

    if (detected.intent === "GUIDE") {
      const guide = this.getGuide();
      return chatbotResponse({
        sessionId,
        intent: "GUIDE",
        action: CHATBOT_ACTIONS.GUIDE_START,
        reply: "Bạn muốn xem hướng dẫn cho thao tác nào?",
        options: guide.topics,
        meta: { intentConfidence: detected.confidence },
      });
    }

    if (detected.intent === "ORDER") {
      const guide = this.getGuide("order");
      return chatbotResponse({
        sessionId,
        intent: "ORDER",
        action: CHATBOT_ACTIONS.ORDER_SUPPORT,
        reply:
          "Mình có thể hướng dẫn kiểm tra đơn, thanh toán lại, hủy đơn và theo dõi hoàn tiền.",
        results: { guide },
        meta: { intentConfidence: detected.confidence },
      });
    }

    if (detected.intent === "ADMIN") {
      const contact = configuredContact();
      return chatbotResponse({
        sessionId,
        intent: "ADMIN",
        action: CHATBOT_ACTIONS.ADMIN_CONTACT,
        reply: contact.configured
          ? "Đây là các kênh liên hệ chính thức của Yarn Shop."
          : "Admin chưa cấu hình kênh liên hệ trong môi trường backend.",
        results: { contact },
        meta: { intentConfidence: detected.confidence },
      });
    }

    const aiResult = await this.#askGemini(message);
    if (aiResult) {
      return chatbotResponse({
        sessionId,
        intent: aiResult.intent || "UNKNOWN",
        action: aiResult.suggestedAction || CHATBOT_ACTIONS.START,
        reply: aiResult.reply,
        options: cloneConfig(MAIN_MENU),
        meta: {
          source: "GEMINI",
          intentConfidence: aiResult.confidence || null,
          grounded: false,
        },
      });
    }

    return chatbotResponse({
      sessionId,
      intent: "UNKNOWN",
      action: CHATBOT_ACTIONS.START,
      reply:
        "Mình chưa hiểu rõ câu hỏi. Bạn hãy chọn một mục bên dưới hoặc yêu cầu gặp nhân viên.",
      options: cloneConfig(MAIN_MENU),
      meta: { source: "GUIDED_FALLBACK", intentConfidence: 0 },
    });
  }

  async #askGemini(message) {
    if (!this.#geminiModel) return null;

    const prompt = `
Bạn là bộ định tuyến hội thoại cho Yarn Shop, một cửa hàng len và đồ đan móc.
Chỉ phân loại ý định và trả lời ngắn bằng tiếng Việt. Không tự tạo giá, tồn kho,
rating, chính sách, thông tin y tế hay thông tin liên hệ.

Các intent hợp lệ: LEARN, SHOP, DIY, GUIDE, ORDER, ADMIN, HANDOFF, UNKNOWN.
Các suggestedAction hợp lệ:
${[...ALLOWED_AI_ACTIONS].join(", ")}

Nếu câu hỏi cần dữ liệu sản phẩm/khóa học, chỉ hướng người dùng vào đúng luồng.
Trả về JSON duy nhất:
{"intent":"...","reply":"...","suggestedAction":"...","confidence":0.0}

Câu hỏi: ${JSON.stringify(String(message).slice(0, 1000))}
`;

    try {
      const result = await this.#geminiModel.generateContent(prompt);
      const parsed = safeJsonFromText(result.response.text());
      if (!parsed || !parsed.reply) return null;
      if (!ALLOWED_AI_ACTIONS.has(parsed.suggestedAction)) {
        parsed.suggestedAction = CHATBOT_ACTIONS.START;
      }
      return parsed;
    } catch (error) {
      console.warn("Gemini chatbot fallback:", error.message);
      return null;
    }
  }

  async #ensureSession({ sessionId, userId }) {
    const resolvedId = sessionId || randomUUID();
    let session = await this.#chatbotRepository.findSession(resolvedId);
    if (!session) {
      session = await this.#chatbotRepository.createSession({
        sessionId: resolvedId,
        userId,
      });
    }
    return { sessionId: resolvedId, session };
  }

  #profileFromAnswers(answers = {}) {
    return {
      level: answers.level,
      recipient: answers.recipient,
      project: answers.project,
      material: answers.material,
      budget: answers.maxPrice,
      preferredDuration: answers.maxDuration,
    };
  }

  async #persistInteraction({
    sessionId,
    message,
    action,
    answers,
    response,
  }) {
    const data = response.data;
    const messages = [];
    if (String(message || "").trim()) {
      messages.push({
        role: "user",
        text: String(message).slice(0, 2000),
        intent: data.intent,
        action,
        metadata: { answers },
      });
    }
    messages.push({
      role: "assistant",
      text: data.reply,
      intent: data.intent,
      action: data.action,
      options: data.options || [],
      metadata: {
        resultCount:
          data.results?.total ??
          data.results?.products?.length ??
          null,
        source: data.meta?.source,
      },
    });

    await this.#chatbotRepository.appendMessages({
      sessionId,
      messages,
      currentIntent: data.intent,
      profile: this.#profileFromAnswers(answers),
    });
  }

  async #persistAssistantOnly(sessionId, response) {
    await this.#chatbotRepository.appendMessages({
      sessionId,
      messages: [
        {
          role: "assistant",
          text: response.data.reply,
          intent: response.data.intent,
          action: response.data.action,
          options: response.data.options || [],
        },
      ],
      currentIntent: response.data.intent,
      profile: {},
    });
  }
}

export { CHATBOT_ACTIONS };
