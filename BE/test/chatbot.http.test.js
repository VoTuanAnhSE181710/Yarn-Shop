import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app.js";
import container, { setupContainer } from "../container.js";

let server;
let baseUrl;

before(async () => {
  setupContainer({
    io: {},
    notificationNamespace: {},
    chatNamespace: {},
  });

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  const redis = container.resolve("redis");
  redis.disconnect();
});

test("GET /api/v1/chatbot/health exposes fallback mode", async () => {
  const response = await fetch(`${baseUrl}/api/v1/chatbot/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "success");
  assert.equal(body.data.service, "yarn-shop-chatbot");
  assert.ok(["HYBRID_AI", "GUIDED_FALLBACK"].includes(body.data.mode));
});

test("GET /api/v1/chatbot/menu exposes guided flows", async () => {
  const response = await fetch(`${baseUrl}/api/v1/chatbot/menu`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.options.length, 6);
  assert.equal(body.data.flows.learn.submitAction, "LEARN_RECOMMEND");
  assert.equal(body.data.flows.shop.submitAction, "SHOP_RECOMMEND");
  assert.equal(body.data.flows.diy.submitAction, "DIY_RECOMMEND");
});
