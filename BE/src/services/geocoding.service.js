import axios from "axios";
import {
  GEOCODING_API_URL,
  GEOCODING_USER_AGENT,
} from "../config/shipping.js";
import { BadRequestError, ExternalServiceError } from "../error/error.js";

export default class GeocodingService {
  async reverseGeocode({ lat, lng }) {
    try {
      const response = await axios.get(`${GEOCODING_API_URL}/reverse`, {
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

      if (!response.data?.display_name) {
        throw new BadRequestError(
          "Không tìm thấy địa chỉ tương ứng với tọa độ này.",
        );
      }

      const address = response.data.address || {};
      return {
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
