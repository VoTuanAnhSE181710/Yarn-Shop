import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

const GHN_API_URL = process.env.GHN_API_URL || "https://online-gateway.ghn.vn/shiip/public-api";
const GHN_API_KEY = process.env.GHN_API_KEY;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;

class GHNService {
    /**
     * Calculate shipping fee via GHN API
     */
    async calculateShippingFee({ to_district_id, to_ward_code, weight, insurance_value }) {
        try {
            const response = await axios.post(
                `${GHN_API_URL}/v2/shipping-order/fee`,
                {
                    service_type_id: 2, // Standard delivery
                    to_district_id: parseInt(to_district_id),
                    to_ward_code: to_ward_code.toString(),
                    weight: parseInt(weight) || 100,
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
            const ghnError = error.response?.data?.message || error.message;
            throw new Error(`Không tính được phí vận chuyển. Lỗi từ GHN: ${ghnError}`);
        }
    }

    /**
     * Get all provinces/cities from GHN master data
     * FE uses this to populate the Province dropdown
     */
    async getProvinces() {
        try {
            const response = await axios.get(
                `${GHN_API_URL}/master-data/province`,
                { headers: { "Token": GHN_API_KEY } }
            );
            if (response.data && response.data.code === 200) {
                return response.data.data.map(p => ({
                    provinceId: p.ProvinceID,
                    provinceName: p.ProvinceName,
                }));
            }
            throw new Error(response.data.message || "Failed to get provinces");
        } catch (error) {
            const ghnError = error.response?.data?.message || error.message;
            throw new Error(`Không lấy được danh sách tỉnh/thành từ GHN: ${ghnError}`);
        }
    }

    /**
     * Get districts of a province from GHN master data
     * FE uses this to populate the District dropdown after Province is selected
     * @param {Number} provinceId
     */
    async getDistricts(provinceId) {
        try {
            const response = await axios.post(
                `${GHN_API_URL}/master-data/district`,
                { province_id: parseInt(provinceId) },
                { headers: { "Token": GHN_API_KEY, "Content-Type": "application/json" } }
            );
            if (response.data && response.data.code === 200) {
                return response.data.data.map(d => ({
                    districtId: d.DistrictID,
                    districtName: d.DistrictName,
                    provinceId: d.ProvinceID,
                }));
            }
            throw new Error(response.data.message || "Failed to get districts");
        } catch (error) {
            const ghnError = error.response?.data?.message || error.message;
            throw new Error(`Không lấy được danh sách quận/huyện từ GHN: ${ghnError}`);
        }
    }

    /**
     * Get wards of a district from GHN master data
     * FE uses this to populate the Ward dropdown after District is selected
     * @param {Number} districtId
     */
    async getWards(districtId) {
        try {
            const response = await axios.post(
                `${GHN_API_URL}/master-data/ward`,
                { district_id: parseInt(districtId) },
                { headers: { "Token": GHN_API_KEY, "Content-Type": "application/json" } }
            );
            if (response.data && response.data.code === 200) {
                return response.data.data.map(w => ({
                    wardCode: w.WardCode,
                    wardName: w.WardName,
                    districtId: w.DistrictID,
                }));
            }
            throw new Error(response.data.message || "Failed to get wards");
        } catch (error) {
            const ghnError = error.response?.data?.message || error.message;
            throw new Error(`Không lấy được danh sách phường/xã từ GHN: ${ghnError}`);
        }
    }
}

export default GHNService;

