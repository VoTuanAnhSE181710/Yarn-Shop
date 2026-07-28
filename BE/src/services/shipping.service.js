import { DEFAULT_SHOP_LOCATION } from "../config/shipping.js";
import { BadRequestError } from "../error/error.js";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const roundCurrency = (amount) => Math.ceil(amount / 1000) * 1000;

export default class ShippingService {
  constructor({ shopLocationRepository, geocodingService }) {
    this.shopLocationRepository = shopLocationRepository;
    this.geocodingService = geocodingService;
  }

  async getShopLocation() {
    const existing = await this.shopLocationRepository.findPrimary();
    if (existing) {
      return existing;
    }

    return this.shopLocationRepository.upsertPrimary(DEFAULT_SHOP_LOCATION);
  }

  async updateShopLocation(data) {
    const current = await this.getShopLocation();
    const deliveryPolicy = {
      ...current.deliveryPolicy,
      ...(data.deliveryPolicy || {}),
    };

    if (deliveryPolicy.minFee > deliveryPolicy.maxFee) {
      throw new BadRequestError(
        "deliveryPolicy.minFee không được lớn hơn maxFee.",
      );
    }
    if (deliveryPolicy.baseDistanceKm > deliveryPolicy.maxDistanceKm) {
      throw new BadRequestError(
        "deliveryPolicy.baseDistanceKm không được lớn hơn maxDistanceKm.",
      );
    }

    const update = {
      ...data,
      deliveryPolicy,
      key: undefined,
    };
    delete update.key;

    if (data.reverseGeocode === true) {
      const geocoded = await this.geocodingService.reverseGeocode({
        lat: data.lat ?? current.lat,
        lng: data.lng ?? current.lng,
      });
      update.address = geocoded.displayName;
      update.communeName = geocoded.commune || current.communeName;
      update.provinceName = geocoded.province || current.provinceName;
    }
    delete update.reverseGeocode;

    return this.shopLocationRepository.upsertPrimary(update);
  }

  async reverseGeocode(coordinates) {
    return this.geocodingService.reverseGeocode(coordinates);
  }

  calculateDistanceKm(origin, destination) {
    const latDelta = toRadians(destination.lat - origin.lat);
    const lngDelta = toRadians(destination.lng - origin.lng);
    const originLat = toRadians(origin.lat);
    const destinationLat = toRadians(destination.lat);

    const a =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(originLat) *
        Math.cos(destinationLat) *
        Math.sin(lngDelta / 2) ** 2;

    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async checkDeliveryArea(destination) {
    const shop = await this.getShopLocation();
    const policy = shop.deliveryPolicy;
    const distanceKm = this.calculateDistanceKm(shop, destination);
    const serviceable =
      shop.isActive &&
      policy.enabled &&
      distanceKm <= policy.maxDistanceKm;

    let reason = null;
    if (!shop.isActive || !policy.enabled) {
      reason = "Dịch vụ giao hàng của shop đang tạm ngưng.";
    } else if (!serviceable) {
      reason = `Địa chỉ nằm ngoài bán kính giao hàng ${policy.maxDistanceKm} km.`;
    }

    return {
      serviceable,
      reason,
      distanceKm: Number(distanceKm.toFixed(2)),
      maxDistanceKm: policy.maxDistanceKm,
      origin: {
        name: shop.name,
        address: shop.address,
        lat: shop.lat,
        lng: shop.lng,
      },
      destination,
    };
  }

  async calculateQuote({ lat, lng, orderValue = 0 }) {
    if (orderValue < 0) {
      throw new BadRequestError("orderValue không được nhỏ hơn 0.");
    }

    const area = await this.checkDeliveryArea({ lat, lng });
    const shop = await this.getShopLocation();
    const policy = shop.deliveryPolicy;

    if (!area.serviceable) {
      return {
        ...area,
        shippingFee: null,
        currency: "VND",
        estimatedDeliveryDays: null,
      };
    }

    let shippingFee = 0;
    let freeShipping = orderValue >= policy.freeShippingThreshold;

    if (!freeShipping) {
      const extraDistance = Math.max(
        0,
        area.distanceKm - policy.baseDistanceKm,
      );
      const calculatedFee =
        policy.baseFee + extraDistance * policy.feePerKm;
      shippingFee = Math.min(
        policy.maxFee,
        Math.max(policy.minFee, roundCurrency(calculatedFee)),
      );
    }

    const estimatedDeliveryDays =
      area.distanceKm <= 20 ? "1-2" : area.distanceKm <= 50 ? "2-3" : "3-5";

    return {
      ...area,
      shippingFee,
      currency: "VND",
      freeShipping,
      freeShippingThreshold: policy.freeShippingThreshold,
      estimatedDeliveryDays,
      pricing: {
        baseDistanceKm: policy.baseDistanceKm,
        baseFee: policy.baseFee,
        feePerKm: policy.feePerKm,
        minFee: policy.minFee,
        maxFee: policy.maxFee,
      },
    };
  }
}
