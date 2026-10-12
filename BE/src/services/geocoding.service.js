import axios from "axios";
import {
  GEOCODING_API_URL,
  GEOCODING_USER_AGENT,
} from "../config/shipping.js";
import { BadRequestError, ExternalServiceError } from "../error/error.js";

// Nominatim công cộng hay trả 429 với IP dùng chung của các host cloud (Render...).
// Cache kết quả theo toạ độ (làm tròn ~11m) và thử lại 1 lần khi bị 429.
const REVERSE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REVERSE_CACHE_MAX = 500;
const reverseCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default class GeocodingService {
  async requestNominatimReverse({ lat, lng }) {
    const call = () =>
      axios.get(`${GEOCODING_API_URL}/reverse`, {
        params: {
          format: "jsonv2",
          lat,
          lon: lng,
          addressdetails: 1,
          "accept-language": "vi",
        },
        headers: {
          "User-Agent": GEOCODING_USER_AGENT,
          Accept: "application/json",
        },
        timeout: 8000,
      });

    try {
      return await call();
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn("[Geocoding] Nominatim 429, retrying once...");
        await sleep(1500);
        return call();
      }
      throw error;
    }
  }

  async reverseGeocode({ lat, lng }) {
    const cacheKey = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
    const cached = reverseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const response = await this.requestNominatimReverse({ lat, lng });

      if (!response.data?.display_name) {
        throw new BadRequestError(
          "Không tìm thấy địa chỉ tương ứng với tọa độ này.",
        );
      }

      const address = response.data.address || {};
      const result = {
        displayName: response.data.display_name,
        houseNumber: address.house_number || null,
        road:
          address.road ||
          address.pedestrian ||
          address.residential ||
          address.hamlet ||
          null,
        commune:
          address.village ||
          address.town ||
          address.suburb ||
          address.quarter ||
          null,
        district:
          address.county || address.city_district || address.district || null,
        province: address.state || address.city || null,
        postcode: address.postcode || null,
        country: address.country || "Việt Nam",
        lat: Number(response.data.lat),
        lng: Number(response.data.lon),
      };

      if (reverseCache.size >= REVERSE_CACHE_MAX) {
        reverseCache.delete(reverseCache.keys().next().value);
      }
      reverseCache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + REVERSE_CACHE_TTL_MS,
      });
      return result;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new ExternalServiceError(
        `Không thể reverse geocode lúc này: ${message}`,
      );
    }
  }

  async geocode(addressStr) {
    try {
      const response = await axios.get(`${GEOCODING_API_URL}/search`, {
        params: {
          format: "jsonv2",
          q: addressStr,
          addressdetails: 1,
          "accept-language": "vi",
        },
        headers: {
          "User-Agent": GEOCODING_USER_AGENT,
          Accept: "application/json",
        },
        timeout: 8000,
      });

      if (!response.data || response.data.length === 0) {
        throw new BadRequestError("Không tìm thấy tọa độ cho địa chỉ này.");
      }

      const firstResult = response.data[0];
      const address = firstResult.address || {};
      
      return {
        displayName: firstResult.display_name,
        lat: Number(firstResult.lat),
        lng: Number(firstResult.lon),
        province: address.state || address.city || null,
        district: address.county || address.city_district || address.district || null,
        commune: address.village || address.town || address.suburb || address.quarter || null,
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      throw new ExternalServiceError(`Không thể geocode lúc này: ${message}`);
    }
  }
}
