import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

const GHN_API_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api";
const GHN_API_KEY = process.env.GHN_API_KEY;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;

class GHNService {
    /**
     * Calculate shipping fee via GHN API
     * @param {Object} params
     * @param {Number} params.to_district_id
     * @param {String} params.to_ward_code
     * @param {Number} params.weight - weight in grams
     * @param {Number} params.insurance_value - total order value
     */
    async calculateShippingFee({ to_district_id, to_ward_code, weight, insurance_value }) {
        try {
            const response = await axios.post(
                `${GHN_API_URL}/v2/shipping-order/fee`,
                {
                    service_type_id: 2, // Standard delivery
                    to_district_id: parseInt(to_district_id),
                    to_ward_code: to_ward_code.toString(),
                    weight: parseInt(weight) || 100, // default 100g if not specified
                    insurance_value: parseInt(insurance_value) || 0,
                },
                {
                    headers: {
                        "Token": GHN_API_KEY,
                        "ShopId": GHN_SHOP_ID,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data && response.data.code === 200) {
                return {
                    total: response.data.data.total,
                    serviceId: response.data.data.service_id,
                };
            }
            throw new Error(response.data.message || "Failed to calculate shipping fee");
        } catch (error) {
            console.error("GHN API Error:", error.response?.data || error.message);
            throw new Error("Không tính được phí vận chuyển. Vui lòng kiểm tra lại địa chỉ.");
        }
    }
}

export default GHNService;
