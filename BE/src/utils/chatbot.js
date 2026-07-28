export const CHATBOT_ACTIONS = Object.freeze({
  START: "START",
  LEARN_START: "LEARN_START",
  LEARN_RECOMMEND: "LEARN_RECOMMEND",
  SHOP_START: "SHOP_START",
  SHOP_RECOMMEND: "SHOP_RECOMMEND",
  DIY_START: "DIY_START",
  DIY_RECOMMEND: "DIY_RECOMMEND",
  GUIDE_START: "GUIDE_START",
  GUIDE_SHOW: "GUIDE_SHOW",
  ORDER_SUPPORT: "ORDER_SUPPORT",
  ADMIN_CONTACT: "ADMIN_CONTACT",
  HANDOFF: "HANDOFF",
  FREE_TEXT: "FREE_TEXT",
});

export const MAIN_MENU = Object.freeze([
  {
    id: "learn",
    label: "🎓 Học đan móc",
    action: CHATBOT_ACTIONS.LEARN_START,
  },
  {
    id: "shop",
    label: "🧶 Tìm sản phẩm",
    action: CHATBOT_ACTIONS.SHOP_START,
  },
  {
    id: "diy",
    label: "🛠️ Hỗ trợ DIY",
    action: CHATBOT_ACTIONS.DIY_START,
  },
  {
    id: "orders",
    label: "📦 Đơn hàng và thanh toán",
    action: CHATBOT_ACTIONS.ORDER_SUPPORT,
  },
  {
    id: "guide",
    label: "📖 Hướng dẫn sử dụng web",
    action: CHATBOT_ACTIONS.GUIDE_START,
  },
  {
    id: "admin",
    label: "👩‍💼 Liên hệ admin",
    action: CHATBOT_ACTIONS.ADMIN_CONTACT,
  },
]);

const INTENT_KEYWORDS = {
  LEARN: [
    "hoc",
    "video",
    "khoa hoc",
    "beginner",
    "mid",
    "pro",
    "huong dan dan",
  ],
  SHOP: [
    "mua",
    "san pham",
    "len",
    "kim",
    "gia",
    "ba bau",
    "tre em",
    "tre so sinh",
    "qua tang",
  ],
  DIY: [
    "diy",
    "tu lam",
    "lam the nao",
    "kit",
    "nguyen lieu",
    "dang lam",
    "bi loi",
  ],
  GUIDE: [
    "su dung web",
    "dang ky",
    "dang nhap",
    "gio hang",
    "checkout",
    "cach dung",
  ],
  ORDER: [
    "don hang",
    "thanh toan",
    "vnpay",
    "momo",
    "giao hang",
    "huy don",
    "hoan tien",
  ],
  ADMIN: [
    "admin",
    "nhan vien",
    "lien he",
    "so dien thoai",
    "email",
    "tu van vien",
  ],
};

const RECIPIENT_TERMS = {
  self: [],
  beginner: ["beginner", "nguoi moi", "de dung", "co ban"],
  baby: [
    "baby",
    "tre so sinh",
    "cotton",
    "mem",
    "sensitive",
    "skin",
    "organic",
  ],
  child: ["tre em", "child", "cotton", "mem", "de giat"],
  pregnant: [
    "ba bau",
    "pregnant",
    "cotton",
    "mem",
    "nhe",
    "sensitive",
    "organic",
  ],
  elderly: ["nguoi lon tuoi", "mem", "nhe", "de cam", "ergonomic"],
  gift: ["qua tang", "gift", "kit"],
};

const PROJECT_TERMS = {
  scarf: ["khan", "scarf"],
  shirt: ["ao", "shirt", "sweater"],
  hat: ["mu", "hat"],
  blanket: ["chan", "blanket"],
  bag: ["tui", "bag"],
  amigurumi: ["thu len", "amigurumi", "toy"],
};

const MATERIAL_TERMS = {
  soft: ["mem", "soft", "sensitive"],
  cotton: ["cotton"],
  natural: ["tu nhien", "natural", "organic", "wool"],
  washable: ["de giat", "washable", "machine wash"],
  economical: ["tiet kiem", "economical", "budget"],
};

export const CHATBOT_FLOWS = Object.freeze({
  learn: {
    id: "learn",
    title: "Tìm nội dung học phù hợp",
    submitAction: CHATBOT_ACTIONS.LEARN_RECOMMEND,
    steps: [
      {
        id: "level",
        label: "Trình độ hiện tại của bạn?",
        required: true,
        options: [
          { label: "Beginner", value: "beginner" },
          { label: "Mid", value: "mid" },
          { label: "Pro", value: "pro" },
          { label: "Chưa biết trình độ", value: "unknown" },
        ],
      },
      {
        id: "topic",
        label: "Bạn muốn học nội dung nào?",
        required: false,
        options: [
          { label: "Kỹ thuật cơ bản", value: "basic" },
          { label: "Đan khăn", value: "scarf" },
          { label: "Đan áo", value: "shirt" },
          { label: "Làm thú len", value: "amigurumi" },
          { label: "Làm túi", value: "bag" },
          { label: "Nội dung khác", value: "other" },
        ],
      },
      {
        id: "maxDuration",
        label: "Độ dài video mong muốn?",
        required: false,
        options: [
          { label: "Dưới 10 phút", value: 600 },
          { label: "10–30 phút", value: 1800 },
          { label: "30–60 phút", value: 3600 },
          { label: "Không giới hạn", value: null },
        ],
      },
    ],
  },
  shop: {
    id: "shop",
    title: "Tư vấn sản phẩm",
    submitAction: CHATBOT_ACTIONS.SHOP_RECOMMEND,
    steps: [
      {
        id: "recipient",
        label: "Bạn mua sản phẩm cho ai?",
        required: true,
        options: [
          { label: "Bản thân", value: "self" },
          { label: "Người mới học", value: "beginner" },
          { label: "Trẻ sơ sinh", value: "baby" },
          { label: "Trẻ em", value: "child" },
          { label: "Bà bầu", value: "pregnant" },
          { label: "Người lớn tuổi", value: "elderly" },
          { label: "Làm quà tặng", value: "gift" },
        ],
      },
      {
        id: "project",
        label: "Bạn muốn làm sản phẩm gì?",
        required: false,
        options: [
          { label: "Khăn", value: "scarf" },
          { label: "Áo", value: "shirt" },
          { label: "Mũ", value: "hat" },
          { label: "Chăn", value: "blanket" },
          { label: "Túi", value: "bag" },
          { label: "Thú len", value: "amigurumi" },
          { label: "Chưa xác định", value: null },
        ],
      },
      {
        id: "material",
        label: "Bạn ưu tiên chất liệu nào?",
        required: false,
        options: [
          { label: "Mềm, ít gây khó chịu", value: "soft" },
          { label: "Cotton", value: "cotton" },
          { label: "Sợi tự nhiên", value: "natural" },
          { label: "Dễ vệ sinh", value: "washable" },
          { label: "Giá tiết kiệm", value: "economical" },
          { label: "Không yêu cầu", value: null },
        ],
      },
      {
        id: "maxPrice",
        label: "Ngân sách tối đa?",
        required: false,
        options: [
          { label: "Dưới 200.000đ", value: 200000 },
          { label: "200.000–500.000đ", value: 500000 },
          { label: "500.000–1.000.000đ", value: 1000000 },
          { label: "Không giới hạn", value: null },
        ],
      },
    ],
  },
  diy: {
    id: "diy",
    title: "Hỗ trợ DIY",
    submitAction: CHATBOT_ACTIONS.DIY_RECOMMEND,
    steps: [
      {
        id: "need",
        label: "Bạn cần hỗ trợ gì?",
        required: true,
        options: [
          { label: "Tìm ý tưởng", value: "idea" },
          { label: "Chọn nguyên liệu", value: "materials" },
          { label: "Tìm kit đầy đủ", value: "kit" },
          { label: "Xem hướng dẫn", value: "tutorial" },
          { label: "Sửa lỗi khi đang làm", value: "troubleshoot" },
          { label: "Gửi yêu cầu nhân viên", value: "staff" },
        ],
      },
      {
        id: "level",
        label: "Trình độ hiện tại?",
        required: false,
        options: [
          { label: "Beginner", value: "beginner" },
          { label: "Mid", value: "intermediate" },
          { label: "Pro", value: "advanced" },
        ],
      },
      {
        id: "project",
        label: "Bạn đang muốn làm gì?",
        required: false,
        options: [
          { label: "Khăn", value: "scarf" },
          { label: "Áo", value: "shirt" },
          { label: "Mũ", value: "hat" },
          { label: "Chăn", value: "blanket" },
          { label: "Túi", value: "bag" },
          { label: "Thú len", value: "amigurumi" },
        ],
      },
    ],
  },
});

export const WEB_GUIDES = Object.freeze({
  register: {
    title: "Đăng ký và đăng nhập",
    steps: [
      "Chọn Sign Up trên thanh điều hướng.",
      "Nhập thông tin tài khoản theo biểu mẫu.",
      "Xác nhận đăng ký, sau đó dùng Sign In để đăng nhập.",
    ],
    deepLink: "/",
  },
  shop: {
    title: "Mua sản phẩm",
    steps: [
      "Mở trang Shop và chọn sản phẩm.",
      "Chọn màu, kích thước và số lượng còn hàng.",
      "Thêm vào giỏ rồi mở Cart để kiểm tra.",
      "Chọn Checkout, địa chỉ giao hàng và phương thức thanh toán.",
    ],
    deepLink: "/shop",
  },
  learn: {
    title: "Đăng ký khóa học",
    steps: [
      "Mở trang Learn.",
      "Chọn khóa học phù hợp với trình độ.",
      "Xem chi tiết và chọn đăng ký học.",
      "Mở Purchased để tiếp tục nội dung đã đăng ký.",
    ],
    deepLink: "/learn",
  },
  diy: {
    title: "Đăng bài DIY",
    steps: [
      "Mở trang Community.",
      "Chọn tạo bài mới và tải ảnh sản phẩm.",
      "Nhập mô tả, tag và sản phẩm/kit liên quan.",
      "Gửi bài và theo dõi trạng thái duyệt.",
    ],
    deepLink: "/community",
  },
  order: {
    title: "Đơn hàng, hủy và hoàn tiền",
    steps: [
      "Mở Profile hoặc Purchased để xem đơn hàng.",
      "Chọn đơn cần kiểm tra.",
      "Nếu đơn đủ điều kiện, chọn yêu cầu hủy hoặc thanh toán lại.",
      "Theo dõi trạng thái hoàn tiền trong chi tiết đơn.",
    ],
    deepLink: "/profile",
  },
});

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferIntent(message = "") {
  const normalized = normalizeText(message);
  let winner = "UNKNOWN";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const score = keywords.reduce(
      (total, keyword) =>
        total + (normalized.includes(normalizeText(keyword)) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      winner = intent;
    }
  }

  return { intent: winner, confidence: bestScore > 0 ? Math.min(0.95, 0.55 + bestScore * 0.1) : 0 };
}

export function extractAnswersFromMessage(message = "") {
  const normalized = normalizeText(message);
  const answers = {};

  if (normalized.includes("ba bau")) answers.recipient = "pregnant";
  else if (normalized.includes("tre so sinh") || normalized.includes("em be")) {
    answers.recipient = "baby";
  } else if (normalized.includes("tre em")) answers.recipient = "child";
  else if (normalized.includes("nguoi moi")) answers.recipient = "beginner";

  if (normalized.includes("beginner") || normalized.includes("co ban")) {
    answers.level = "beginner";
  } else if (normalized.includes("mid") || normalized.includes("trung cap")) {
    answers.level = "mid";
  } else if (normalized.includes("pro") || normalized.includes("nang cao")) {
    answers.level = "pro";
  }

  for (const project of Object.keys(PROJECT_TERMS)) {
    if (PROJECT_TERMS[project].some((term) => normalized.includes(normalizeText(term)))) {
      answers.project = project;
      break;
    }
  }

  const moneyMatch = normalized.match(/(?:duoi|toi da|khoang)?\s*(\d+(?:[.,]\d+)?)\s*(trieu|k|nghin|ngan)?/);
  if (moneyMatch) {
    let amount = Number(moneyMatch[1].replace(",", "."));
    const unit = moneyMatch[2];
    if (unit === "trieu") amount *= 1000000;
    else if (["k", "nghin", "ngan"].includes(unit)) amount *= 1000;
    if (amount >= 10000) answers.maxPrice = Math.round(amount);
  }

  return answers;
}

export function getVariantSummary(product = {}) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const prices = variants
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);
  const totalStock = variants.reduce(
    (total, variant) => total + Math.max(0, Number(variant.stock) || 0),
    0,
  );

  return {
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    totalStock,
  };
}

function countTermMatches(haystack, terms = []) {
  return terms.reduce(
    (total, term) => total + (haystack.includes(normalizeText(term)) ? 1 : 0),
    0,
  );
}

export function scoreProduct(product, answers = {}) {
  const variant = getVariantSummary(product);
  const haystack = normalizeText(
    [product.name, product.description, ...(product.tags || [])].join(" "),
  );
  let score = 0;
  const reasons = [];

  const recipientTerms = RECIPIENT_TERMS[answers.recipient] || [];
  const recipientMatches = countTermMatches(haystack, recipientTerms);
  if (answers.recipient) {
    score += Math.min(35, recipientMatches * 10);
    if (recipientMatches) reasons.push("phù hợp với đối tượng sử dụng");
  } else {
    score += 15;
  }

  const projectTerms = PROJECT_TERMS[answers.project] || [];
  const projectMatches = countTermMatches(haystack, projectTerms);
  if (answers.project) {
    score += Math.min(20, projectMatches * 10);
    if (projectMatches) reasons.push("phù hợp với sản phẩm bạn muốn làm");
  }

  const materialTerms = MATERIAL_TERMS[answers.material] || [];
  const materialMatches = countTermMatches(haystack, materialTerms);
  if (answers.material) {
    score += Math.min(15, materialMatches * 8);
    if (materialMatches) reasons.push("đúng ưu tiên chất liệu");
  }

  if (answers.maxPrice && variant.minPrice !== null) {
    if (variant.minPrice <= Number(answers.maxPrice)) {
      score += 15;
      reasons.push("nằm trong ngân sách");
    } else {
      score -= 30;
    }
  } else {
    score += 8;
  }

  const rating = Number(product.averageRating) || 0;
  score += Math.min(10, rating * 2);
  if (rating >= 4) reasons.push("được khách hàng đánh giá tốt");

  if (variant.totalStock > 0) {
    score += 5;
    reasons.push("hiện còn hàng");
  } else {
    score -= 100;
  }

  return {
    score: Math.max(0, Number(score.toFixed(2))),
    reasons: [...new Set(reasons)],
    ...variant,
  };
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.ceil((total % 3600) / 60);
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

export function cloneConfig(value) {
  return JSON.parse(JSON.stringify(value));
}

export function safeJsonFromText(text = "") {
  const cleaned = String(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
