import test from "node:test";
import assert from "node:assert/strict";
import ProductChatService from "../src/services/productChat.service.js";
import { productChatSchema } from "../src/validators/chatbot.validator.js";

const COTTON_ID = "6a687ba2a3588e3f5d774dbc";
const WOOL_ID = "6a687ba2a3588e3f5d774dbe";

const products = [
  {
    _id: COTTON_ID,
    name: "Milk Cotton",
    category: "yarn",
    image: "cotton.jpg",
    isActive: true,
    variants: [
      { color: "Trắng", size: "100g", price: 65000, stock: 12 },
      { color: "Đỏ", size: "100g", price: 70000, stock: 4 },
    ],
  },
  {
    _id: WOOL_ID,
    name: "Wool Yarn",
    category: "yarn",
    image: "wool.jpg",
    isActive: true,
    variants: [{ color: "Xanh", size: "100g", price: 120000, stock: 0 }],
  },
];

function createService({
  failProducts = false,
  aiModel = false,
  onQuery = () => {},
} = {}) {
  const productService = {
    async getProducts(filters) {
      if (failProducts) throw new Error("Database unavailable");
      onQuery(filters);
      let result = [...products];
      if (filters.search) {
        result = result.filter((product) =>
          product.name.toLowerCase().includes(filters.search.toLowerCase()),
        );
      }
      if (filters.category) {
        result = result.filter((product) => product.category === filters.category);
      }
      if (filters.maxPrice !== undefined) {
        result = result.filter((product) =>
          product.variants.some((variant) => variant.price <= filters.maxPrice),
        );
      }
      return { products: result.slice(0, filters.limit) };
    },
    async getProductById(id) {
      const product = products.find((item) => item._id === id);
      if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
      }
      return product;
    },
  };
  return new ProductChatService({ productService }, { aiModel });
}

test("returns requested count using only ProductService results", async () => {
  const service = createService({
    onQuery: (filters) => assert.equal(filters.limit, 10),
  });
  const result = await service.sendMessage({ message: "Kể tôi 10 sản phẩm" });

  assert.equal(result.status, "success");
  assert.equal(result.data.products.length, 2);
  assert.match(result.data.reply, /Milk Cotton/);
  assert.match(result.data.reply, /65\.000đ/);
});

test("searches Cotton from backend and applies the requested price ceiling", async () => {
  const service = createService();
  const result = await service.sendMessage({
    message: "Có sản phẩm Cotton nào dưới 100000 không?",
  });

  assert.deepEqual(result.data.products.map(({ name }) => name), ["Milk Cotton"]);
  assert.deepEqual(
    result.data.products[0].variants.map(({ price }) => price),
    [65000, 70000],
  );
});

test("recognizes a grouped VND price ceiling", async () => {
  const service = createService();
  const result = await service.sendMessage({
    message: "Cho tôi sản phẩm dưới 100.000 đồng",
  });

  assert.deepEqual(result.data.products.map(({ name }) => name), ["Milk Cotton"]);
});

test("uses category and quantity filters for product requests", async () => {
  const service = createService({
    onQuery: (filters) => {
      assert.equal(filters.limit, 5);
      assert.equal(filters.category, "yarn");
    },
  });
  const result = await service.sendMessage({
    message: "Cho tôi 5 sản phẩm thuộc danh mục len",
  });

  assert.equal(result.data.products.length, 2);
  assert.ok(result.data.products.every((product) => product.category === "yarn"));
});

test("states that no matching product was found instead of inventing one", async () => {
  const service = createService();
  const result = await service.sendMessage({
    message: "Có sản phẩm mohair không?",
  });

  assert.deepEqual(result.data.products, []);
  assert.match(result.data.reply, /không tìm thấy sản phẩm phù hợp/);
});

test("uses Gemini's structured intent while grounding results in ProductService", async () => {
  let called = false;
  const service = createService({
    aiModel: {
      async generateContent() {
        called = true;
        return {
          response: {
            text: () =>
              JSON.stringify({
                intent: "product_search",
                limit: 1,
                search: "cotton",
                category: "",
                minPrice: null,
                maxPrice: null,
                productIndex: null,
              }),
          },
        };
      },
    },
  });
  const result = await service.sendMessage({
    message: "Cho tôi một sản phẩm Cotton",
  });

  assert.equal(called, true);
  assert.deepEqual(result.data.products.map(({ name }) => name), ["Milk Cotton"]);
});

test("reloads the first referenced product for price and stock follow-ups", async () => {
  const service = createService();
  const result = await service.sendMessage({
    conversationId: "chat-session-001",
    message: "Cái đầu tiên giá bao nhiêu? Còn tồn kho không?",
    contextProductIds: [COTTON_ID, WOOL_ID],
  });

  assert.equal(result.data.products.length, 1);
  assert.equal(result.data.products[0].id, COTTON_ID);
  assert.deepEqual(
    result.data.products[0].variants.map(({ price, stock }) => [price, stock]),
    [
      [65000, 12],
      [70000, 4],
    ],
  );
});

test("returns an explicit product-data error when the backend lookup fails", async () => {
  const service = createService({ failProducts: true });
  await assert.rejects(
    service.sendMessage({ message: "Kể tôi 5 sản phẩm" }),
    { message: "PRODUCT_DATA_UNAVAILABLE", statusCode: 502 },
  );
});

test("says when the backend has no inventory field", async () => {
  const productService = {
    async getProductById() {
      return {
        _id: COTTON_ID,
        name: "Milk Cotton",
        isActive: true,
        variants: [{ color: "Trắng", price: 65000 }],
      };
    },
  };
  const service = new ProductChatService({ productService }, { aiModel: false });
  const result = await service.sendMessage({
    message: "Sản phẩm này còn tồn kho không?",
    contextProductIds: [COTTON_ID],
  });

  assert.match(result.data.reply, /không cung cấp thông tin tồn kho/);
});

test("returns an explicit AI-provider error when Gemini fails", async () => {
  const service = createService({
    aiModel: {
      async generateContent() {
        throw new Error("Provider unavailable");
      },
    },
  });
  await assert.rejects(
    service.sendMessage({ message: "Kể tôi 5 sản phẩm" }),
    { message: "AI_PROVIDER_UNAVAILABLE", statusCode: 502 },
  );
});

test("rejects blank messages and more than ten context product IDs", () => {
  assert.ok(productChatSchema.validate({ message: "   " }).error);
  assert.ok(
    productChatSchema.validate({
      message: "Giá bao nhiêu?",
      contextProductIds: Array.from({ length: 11 }, () => COTTON_ID),
    }).error,
  );
});
