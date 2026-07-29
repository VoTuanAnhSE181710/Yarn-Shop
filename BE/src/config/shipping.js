const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

export const DEFAULT_SHOP_LOCATION = {
  key: "primary",
  name: process.env.SHOP_LOCATION_NAME || "Yarn Shop Vĩnh Kim",
  address:
    process.env.SHOP_ADDRESS ||
    "Trung tâm Phục vụ Hành chính công xã Vĩnh Kim, ấp Vĩnh Thạnh, xã Vĩnh Kim, tỉnh Đồng Tháp",
  communeName: process.env.SHOP_COMMUNE_NAME || "Xã Vĩnh Kim",
  provinceName: process.env.SHOP_PROVINCE_NAME || "Tỉnh Đồng Tháp",
  lat: numberFromEnv("SHOP_LAT", 10.357225),
  lng: numberFromEnv("SHOP_LNG", 106.244531),
  isActive: true,
  deliveryPolicy: {
    enabled: true,
    maxDistanceKm: numberFromEnv("SHIPPING_MAX_DISTANCE_KM", 100),
    baseDistanceKm: numberFromEnv("SHIPPING_BASE_DISTANCE_KM", 5),
    baseFee: numberFromEnv("SHIPPING_BASE_FEE", 15000),
    feePerKm: numberFromEnv("SHIPPING_FEE_PER_KM", 2500),
    minFee: numberFromEnv("SHIPPING_MIN_FEE", 15000),
    maxFee: numberFromEnv("SHIPPING_MAX_FEE", 150000),
    freeShippingThreshold: numberFromEnv(
      "SHIPPING_FREE_THRESHOLD",
      500000,
    ),
  },
};

export const GEOCODING_API_URL =
  process.env.GEOCODING_API_URL || "https://nominatim.openstreetmap.org";

export const GEOCODING_USER_AGENT =
  process.env.GEOCODING_USER_AGENT ||
  "YarnShop/1.0 (shipping-address-service)";
