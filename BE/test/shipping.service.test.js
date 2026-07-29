import test from "node:test";
import assert from "node:assert/strict";
import ShippingService from "../src/services/shipping.service.js";

const shopLocation = {
  key: "primary",
  name: "Yarn Shop Vĩnh Kim",
  address:
    "Trung tâm Phục vụ Hành chính công xã Vĩnh Kim, ấp Vĩnh Thạnh, xã Vĩnh Kim, tỉnh Đồng Tháp",
  communeName: "Xã Vĩnh Kim",
  provinceName: "Tỉnh Đồng Tháp",
  lat: 10.357225,
  lng: 106.244531,
  isActive: true,
  deliveryPolicy: {
    enabled: true,
    maxDistanceKm: 100,
    baseDistanceKm: 5,
    baseFee: 15000,
    feePerKm: 2500,
    minFee: 15000,
    maxFee: 150000,
    freeShippingThreshold: 500000,
  },
};

const createService = ({
  current = shopLocation,
  reverseResult = null,
} = {}) => {
  let stored = current;
  const repository = {
    findPrimary: async () => stored,
    upsertPrimary: async (data) => {
      stored = { ...(stored || {}), ...data };
      return stored;
    },
  };
  const geocodingService = {
    reverseGeocode: async () =>
      reverseResult || {
        displayName: shopLocation.address,
        commune: shopLocation.communeName,
        province: shopLocation.provinceName,
        lat: shopLocation.lat,
        lng: shopLocation.lng,
      },
  };

  return {
    service: new ShippingService({
      shopLocationRepository: repository,
      geocodingService,
    }),
    getStored: () => stored,
  };
};

test("bootstraps the approved Vĩnh Kim shop location when DB is empty", async () => {
  const { service, getStored } = createService({ current: null });

  const result = await service.getShopLocation();

  assert.equal(result.lat, 10.357225);
  assert.equal(result.lng, 106.244531);
  assert.match(result.address, /Vĩnh Kim/);
  assert.equal(getStored().key, "primary");
});

test("returns serviceable for a destination at the shop coordinates", async () => {
  const { service } = createService();

  const result = await service.checkDeliveryArea({
    lat: shopLocation.lat,
    lng: shopLocation.lng,
  });

  assert.equal(result.serviceable, true);
  assert.equal(result.distanceKm, 0);
});

test("returns not serviceable outside the configured radius", async () => {
  const { service } = createService();

  const result = await service.checkDeliveryArea({
    lat: 12.357225,
    lng: 106.244531,
  });

  assert.equal(result.serviceable, false);
  assert.equal(result.shippingFee, undefined);
  assert.match(result.reason, /ngoài bán kính/);
});

test("calculates and rounds a distance-based fee", async () => {
  const { service } = createService();

  const result = await service.calculateQuote({
    lat: 10.447225,
    lng: 106.244531,
    orderValue: 200000,
  });

  assert.equal(result.serviceable, true);
  assert.equal(result.currency, "VND");
  assert.equal(result.freeShipping, false);
  assert.ok(result.shippingFee > 15000);
  assert.equal(result.shippingFee % 1000, 0);
});

test("applies free shipping at the configured order threshold", async () => {
  const { service } = createService();

  const result = await service.calculateQuote({
    lat: 10.447225,
    lng: 106.244531,
    orderValue: 500000,
  });

  assert.equal(result.serviceable, true);
  assert.equal(result.freeShipping, true);
  assert.equal(result.shippingFee, 0);
});

test("updates the readable shop address using reverse geocoding", async () => {
  const { service } = createService({
    reverseResult: {
      displayName: "Địa chỉ được chuẩn hóa",
      commune: "Xã Vĩnh Kim",
      province: "Tỉnh Đồng Tháp",
    },
  });

  const result = await service.updateShopLocation({
    lat: 10.357225,
    lng: 106.244531,
    reverseGeocode: true,
  });

  assert.equal(result.address, "Địa chỉ được chuẩn hóa");
});

test("rejects an invalid delivery fee policy", async () => {
  const { service } = createService();

  await assert.rejects(
    service.updateShopLocation({
      deliveryPolicy: { minFee: 200000, maxFee: 100000 },
    }),
    /minFee/,
  );
});
