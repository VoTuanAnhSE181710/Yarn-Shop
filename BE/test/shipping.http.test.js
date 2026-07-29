import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import shippingRouter from "../src/api/routes/shipping.router.js";
import ShippingController from "../src/api/controllers/shipping.controller.js";

const startServer = async () => {
  const shippingService = {
    getShopLocation: async () => shopLocation,
    checkDeliveryArea: async (body) => ({
      serviceable: true,
      distanceKm: 0,
      destination: body,
    }),
    calculateQuote: async (body) => ({
      serviceable: true,
      distanceKm: 0,
      shippingFee: 15000,
      currency: "VND",
      destination: body,
    }),
  };
  const controller = new ShippingController({ shippingService });
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.container = {
      resolve: (name) => {
        assert.equal(name, "shippingController");
        return controller;
      },
    };
    next();
  });
  app.use("/api/v1/shipping", shippingRouter);
  app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}/api/v1/shipping`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

const shopLocation = {
  name: "Yarn Shop Vĩnh Kim",
  address: "Ấp Vĩnh Thạnh, xã Vĩnh Kim, tỉnh Đồng Tháp",
  lat: 10.357225,
  lng: 106.244531,
};

test("GET /shipping/shop-location returns the configured origin", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/shop-location`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "success");
    assert.equal(body.data.shopLocation.lat, 10.357225);
  } finally {
    await server.close();
  }
});

test("POST /shipping/check-area accepts valid coordinates", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/check-area`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 10.357225, lng: 106.244531 }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.serviceable, true);
  } finally {
    await server.close();
  }
});

test("POST /shipping/quote rejects invalid coordinates", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 100, lng: 106.244531 }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.message, /lat/);
  } finally {
    await server.close();
  }
});
