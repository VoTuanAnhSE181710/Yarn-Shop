import test from "node:test";
import assert from "node:assert/strict";
import ChatbotService, {
  CHATBOT_ACTIONS,
} from "../src/services/chatbot.service.js";
import {
  extractAnswersFromMessage,
  inferIntent,
  scoreProduct,
} from "../src/utils/chatbot.js";

class FakeChatbotRepository {
  constructor() {
    this.sessions = new Map();
    this.persisted = [];
  }

  findSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  createSession({ sessionId, userId }) {
    const session = { sessionId, userId, status: "ACTIVE" };
    this.sessions.set(sessionId, session);
    return session;
  }

  appendMessages(payload) {
    this.persisted.push(payload);
    return this.sessions.get(payload.sessionId);
  }

  markHandoff({ sessionId, reason }) {
    const session = this.sessions.get(sessionId);
    session.status = "HANDOFF";
    session.reason = reason;
    return session;
  }

  findLearning() {
    return {
      courses: [
        {
          _id: "course-1",
          title: "Đan móc cơ bản",
          description: "Khóa học cho người mới",
          thumbnail: "course.jpg",
          level: "beginner",
          totalDuration: 1800,
          averageRating: 4.8,
          totalRatings: 20,
          enrolledCount: 120,
          enrolled: false,
        },
      ],
      videos: [
        {
          _id: "video-1",
          title: "Mũi móc đầu tiên",
          description: "Video nhập môn",
          thumbnail: { url: "video.jpg" },
          duration: 480,
          averageRating: 4.5,
          viewCount: 1000,
        },
      ],
    };
  }

  findProducts() {
    return [
      {
        _id: "cotton",
        name: "Soft Cotton Yarn",
        description: "Sợi cotton mềm cho da nhạy cảm và đồ em bé",
        category: "yarn",
        image: "cotton.jpg",
        tags: ["cotton", "soft", "baby"],
        variants: [{ price: 150000, stock: 10 }],
        averageRating: 4.9,
        totalRatings: 100,
      },
      {
        _id: "wool",
        name: "Premium Wool",
        description: "Len cao cấp cho áo khoác",
        category: "yarn",
        image: "wool.jpg",
        tags: ["wool"],
        variants: [{ price: 700000, stock: 20 }],
        averageRating: 4.7,
        totalRatings: 50,
      },
      {
        _id: "sold-out",
        name: "Sold Out Cotton",
        description: "Cotton mềm",
        category: "yarn",
        image: "sold-out.jpg",
        tags: ["cotton", "soft"],
        variants: [{ price: 100000, stock: 0 }],
        averageRating: 5,
        totalRatings: 10,
      },
    ];
  }

  findDIY() {
    return {
      kits: [
        {
          _id: "kit-1",
          name: "Beginner Scarf Kit",
          description: "Bộ làm khăn cho người mới",
          thumbnail: "kit.jpg",
          level: "beginner",
          price: 250000,
          averageRating: 4.6,
          totalRatings: 15,
        },
      ],
      posts: [],
    };
  }
}

function createService() {
  delete process.env.GEMINI_API_KEY;
  const repository = new FakeChatbotRepository();
  return {
    repository,
    service: new ChatbotService({ chatbotRepository: repository }),
  };
}

test("intent parser detects Vietnamese shop questions", () => {
  const detected = inferIntent("Bà bầu nên mua loại len nào?");
  assert.equal(detected.intent, "SHOP");

  const answers = extractAnswersFromMessage(
    "Bà bầu nên mua len làm khăn dưới 500k",
  );
  assert.equal(answers.recipient, "pregnant");
  assert.equal(answers.project, "scarf");
  assert.equal(answers.maxPrice, 500000);
});

test("word matching does not mistake mua for the project mũ", () => {
  const answers = extractAnswersFromMessage(
    "Tôi là người mới học móc len, nên mua gì dưới 200000 đồng?",
  );

  assert.equal(answers.recipient, "beginner");
  assert.equal(answers.project, undefined);
  assert.equal(answers.maxPrice, 200000);
});

test("product scoring favors suitable in-stock cotton", () => {
  const cotton = scoreProduct(
    {
      name: "Soft Cotton",
      description: "Cotton mềm cho em bé",
      tags: ["baby", "sensitive"],
      variants: [{ price: 150000, stock: 10 }],
      averageRating: 4.8,
    },
    {
      recipient: "baby",
      material: "cotton",
      maxPrice: 200000,
    },
  );
  const wool = scoreProduct(
    {
      name: "Expensive Wool",
      description: "Wool",
      tags: [],
      variants: [{ price: 700000, stock: 10 }],
      averageRating: 5,
    },
    {
      recipient: "baby",
      material: "cotton",
      maxPrice: 200000,
    },
  );

  assert.ok(cotton.score > wool.score);
  assert.ok(cotton.reasons.includes("nằm trong ngân sách"));
});

test("guided session returns six customer menu options", async () => {
  const { service } = createService();
  const response = await service.createSession({
    sessionId: "test-session-1",
  });

  assert.equal(response.status, "success");
  assert.equal(response.data.options.length, 6);
  assert.equal(response.data.action, CHATBOT_ACTIONS.START);
});

test("shop recommendation is grounded, in stock, and within budget", async () => {
  const { service } = createService();
  const recommendation = await service.recommendShop({
    recipient: "pregnant",
    material: "cotton",
    maxPrice: 500000,
  });

  assert.equal(recommendation.total, 1);
  assert.equal(recommendation.products[0].id, "cotton");
  assert.equal(recommendation.products[0].totalStock, 10);
  assert.match(recommendation.safetyNotice, /không đưa ra tư vấn y tế/i);
});

test("learn recommendation returns course and video metadata", async () => {
  const { service } = createService();
  const recommendation = await service.recommendLearn({
    level: "beginner",
    maxDuration: 600,
  });

  assert.equal(recommendation.total, 2);
  assert.equal(recommendation.courses[0].level, "beginner");
  assert.equal(recommendation.videos[0].duration, "8 phút");
});

test("unknown free text falls back to guided menu without Gemini", async () => {
  const { service, repository } = createService();
  const response = await service.handleMessage({
    sessionId: "test-session-2",
    message: "Một câu không thuộc phạm vi cửa hàng",
    action: CHATBOT_ACTIONS.FREE_TEXT,
  });

  assert.equal(response.data.intent, "UNKNOWN");
  assert.equal(response.data.meta.source, "GUIDED_FALLBACK");
  assert.equal(response.data.options.length, 6);
  assert.equal(repository.persisted.length, 1);
});
