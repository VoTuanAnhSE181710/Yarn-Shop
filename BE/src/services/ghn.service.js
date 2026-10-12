import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

const GHN_API_URL = process.env.GHN_API_URL || "https://online-gateway.ghn.vn/shiip/public-api";
const GHN_API_KEY = process.env.GHN_API_KEY;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;

/**
 * Helper to normalize Vietnamese address string for fuzzy matching
 */
function normalizeAddressString(str) {
    if (!str) return "";
    let normalized = str.toLowerCase();
    // Remove vietnamese tones
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    normalized = normalized.replace(/đ/g, "d");
    
    // Remove standard prefixes
    const prefixes = ["thanh pho ", "tinh ", "quan ", "huyen ", "thi xa ", "phuong ", "xa ", "thi tran "];
    for (const prefix of prefixes) {
        if (normalized.startsWith(prefix)) {
            normalized = normalized.substring(prefix.length);
        }
    }
    // Remove extra spaces and punctuation
    return normalized.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Sau sáp nhập tỉnh 2025, Map (OSM) trả tên tỉnh MỚI nhưng GHN vẫn dùng tỉnh CŨ.
// key: tên tỉnh mới (đã chuẩn hoá) -> các tỉnh cũ (đã chuẩn hoá) được gộp vào.
const MERGED_PROVINCES = {
    "tuyen quang": ["ha giang"],
    "lao cai": ["yen bai"],
    "thai nguyen": ["bac kan"],
    "phu tho": ["vinh phuc", "hoa binh"],
    "bac ninh": ["bac giang"],
    "hung yen": ["thai binh"],
    "hai phong": ["hai duong"],
    "ninh binh": ["ha nam", "nam dinh"],
    "quang tri": ["quang binh"],
    "da nang": ["quang nam"],
    "quang ngai": ["kon tum"],
    "gia lai": ["binh dinh"],
    "khanh hoa": ["ninh thuan"],
    "lam dong": ["dak nong", "binh thuan"],
    "dak lak": ["phu yen"],
    "ho chi minh": ["binh duong", "ba ria vung tau"],
    "dong nai": ["binh phuoc"],
    "tay ninh": ["long an"],
    "can tho": ["soc trang", "hau giang"],
    "vinh long": ["ben tre", "tra vinh"],
    "dong thap": ["tien giang"],
    "ca mau": ["bac lieu"],
    "an giang": ["kien giang"],
};

// Cache dữ liệu danh mục GHN (ít thay đổi) để tránh gọi lặp lại khi khớp địa chỉ.
const MASTER_CACHE_TTL_MS = 60 * 60 * 1000;
const masterCache = new Map();
async function cachedMaster(key, loader) {
    const hit = masterCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
    const value = await loader();
    masterCache.set(key, { value, expiresAt: Date.now() + MASTER_CACHE_TTL_MS });
    return value;
}

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
     * Calculate expected delivery time (Lead Time) via GHN API
     */
    async calculateExpectedDeliveryTime({ to_district_id, to_ward_code }) {
        try {
            const response = await axios.post(
                `${GHN_API_URL}/v2/shipping-order/leadtime`,
                {
                    service_type_id: 2, // Standard delivery
                    to_district_id: parseInt(to_district_id),
                    to_ward_code: to_ward_code.toString(),
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
                // leadtime timestamp (unix epoch)
                const leadtimeEpoch = response.data.data.leadtime;
                return new Date(leadtimeEpoch * 1000); 
            }
            return null;
        } catch (error) {
            console.error("GHN LeadTime API Error:", error.response?.data || error.message);
            return null; // Don't crash if leadtime fails
        }
    }

    /**
     * Tự động tạo đơn hàng sang hệ thống GHN để Shipper tới lấy
     */
    async createShippingOrder(order, weight = 200, length = 10, width = 10, height = 10) {
        try {
            // Tính số tiền COD
            const codAmount = order.payment.method === "COD" ? order.totalPrice : 0;
            
            // Xây dựng danh sách item theo format GHN
            const items = order.items.map(i => ({
                name: i.name || "Sản phẩm",
                quantity: i.quantity || 1,
                price: i.price || 0,
                weight: 50 // Giả định mỗi món 50 gram
            }));

            // Nếu đơn không có SP vật lý (chỉ có khóa học)
            if (items.length === 0) {
                items.push({ name: "Gói hàng", quantity: 1, price: 0, weight: 100 });
            }

            const payload = {
                payment_type_id: 1, // 1: Shop trả phí ship (Vì lúc checkout user đã thanh toán cả ship cho mình rồi)
                note: `Đơn hàng ${order._id}`,
                required_note: "CHOXEMHANGKHONGTHU", // Cho phép khách xem hàng
                to_name: order.shippingAddress.fullName,
                to_phone: order.shippingAddress.phone,
                to_address: order.shippingAddress.address || "Địa chỉ mặc định",
                to_ward_code: order.shippingAddress.wardCode?.toString(),
                to_district_id: parseInt(order.shippingAddress.districtId),
                cod_amount: parseInt(codAmount),
                weight: parseInt(weight),
                length: parseInt(length),
                width: parseInt(width),
                height: parseInt(height),
                insurance_value: parseInt(order.itemsPrice) || 0,
                service_type_id: 2,
                items: items
            };

            const response = await axios.post(
                `${GHN_API_URL}/v2/shipping-order/create`,
                payload,
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
                    trackingCode: response.data.data.order_code,
                    expectedDeliveryTime: response.data.data.expected_delivery_time,
                };
            }
            throw new Error(response.data.message || "Failed to create GHN order");
        } catch (error) {
            console.error("GHN Create Order Error:", error.response?.data || error.message);
            throw new Error(`Lỗi tạo đơn GHN: ${error.response?.data?.message || error.message}`);
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

    /**
     * Tìm xã/phường theo tên (khớp chính xác sau khi chuẩn hoá) trong tất cả quận/huyện của một tỉnh.
     * Dùng khi tên quận/huyện từ Map không khớp GHN.
     * @returns {{districtId:number, wardCode:string}|null}
     */
    async findWardAcrossDistricts(districts, candidateNames, { allowPrefix = false } = {}) {
        const targets = candidateNames.map(normalizeAddressString).filter(Boolean);
        if (!targets.length) return null;

        // allowPrefix: phường/xã mới sau sáp nhập thường gộp từ nhiều phường cũ
        // (vd "Phước Long" <- "Phước Long A" + "Phước Long B"), nên chấp nhận tên GHN bắt đầu bằng tên đó.
        const isMatch = (wardName) => {
            const n = normalizeAddressString(wardName);
            return targets.some(t => n === t || (allowPrefix && n.startsWith(t + " ")));
        };

        const results = await Promise.all(districts.map(async (d) => {
            try {
                const wards = await cachedMaster(`wards:${d.districtId}`, () => this.getWards(d.districtId));
                const w = wards.find(x => isMatch(x.wardName));
                return w ? { districtId: d.districtId, wardCode: w.wardCode } : null;
            } catch (err) {
                return null;
            }
        }));

        const matches = results.filter(Boolean);
        if (matches.length > 1) {
            console.warn(`[GHN] Ward "${candidateNames.join(" / ")}" matches ${matches.length} districts, using the first one`);
        }
        return matches[0] || null;
    }

    /**
     * Khớp quận/huyện + xã/phường trong MỘT tỉnh của GHN.
     */
    async matchWithinProvince(province, { districtName, wardName }) {
        const normDist = normalizeAddressString(districtName);
        const normWard = normalizeAddressString(wardName);

        const districts = await cachedMaster(`districts:${province.provinceId}`, () => this.getDistricts(province.provinceId));
        const matchedDistrict = districts.find(d => {
            const dNorm = normalizeAddressString(d.districtName);
            return dNorm === normDist || dNorm.includes(normDist) || normDist.includes(dNorm);
        });

        if (!matchedDistrict) {
            // Map/Nominatim thường trả tên xã/phường vào chỗ "quận/huyện" (địa chỉ 2 cấp sau 2025),
            // nên thử tìm xã/phường đó trong tất cả quận/huyện của tỉnh.
            const found = await this.findWardAcrossDistricts(districts, [wardName, districtName]);
            if (found) {
                return { success: true, provinceId: province.provinceId, districtId: found.districtId, wardCode: found.wardCode };
            }
            return {
                success: false,
                message: `Could not match district: ${districtName} in ${province.provinceName}`,
                provinceId: province.provinceId
            };
        }

        const wards = await cachedMaster(`wards:${matchedDistrict.districtId}`, () => this.getWards(matchedDistrict.districtId));
        const matchedWard = wards.find(w => {
            const wNorm = normalizeAddressString(w.wardName);
            return wNorm === normWard || wNorm.includes(normWard) || normWard.includes(wNorm);
        });

        if (!matchedWard) {
            const found = await this.findWardAcrossDistricts(districts, [wardName]);
            if (found) {
                return { success: true, provinceId: province.provinceId, districtId: found.districtId, wardCode: found.wardCode };
            }
            return {
                success: false,
                message: `Could not match ward: ${wardName} in ${matchedDistrict.districtName}`,
                provinceId: province.provinceId,
                districtId: matchedDistrict.districtId
            };
        }

        return {
            success: true,
            provinceId: province.provinceId,
            districtId: matchedDistrict.districtId,
            wardCode: matchedWard.wardCode
        };
    }

    /**
     * Map raw address strings (from Map APIs) to GHN IDs
     */
    async mapAddressToGHN({ provinceName, districtName, wardName }) {
        try {
            const normProv = normalizeAddressString(provinceName);

            // 1. Find Province
            const provinces = await cachedMaster("provinces", () => this.getProvinces());
            const matchedProvince = provinces.find(p => {
                const pNorm = normalizeAddressString(p.provinceName);
                return pNorm === normProv || pNorm.includes(normProv) || normProv.includes(pNorm);
            });
            if (!matchedProvince) {
                return { success: false, message: `Could not match province: ${provinceName}` };
            }

            // 2. Tỉnh khớp tên trước, rồi tới các tỉnh cũ đã sáp nhập vào nó (GHN vẫn dùng tỉnh cũ)
            const candidates = [matchedProvince];
            const matchedNorm = normalizeAddressString(matchedProvince.provinceName);
            for (const oldName of MERGED_PROVINCES[matchedNorm] || []) {
                const old = provinces.find(p => normalizeAddressString(p.provinceName) === oldName);
                if (old && old.provinceId !== matchedProvince.provinceId) candidates.push(old);
            }

            // 3. Find District + Ward trong từng tỉnh ứng viên
            let firstFailure = null;
            for (const province of candidates) {
                const result = await this.matchWithinProvince(province, { districtName, wardName });
                if (result.success) return result;
                firstFailure = firstFailure || result;
            }

            // 4. Lượt 2: không có tên khớp chính xác ở đâu -> chấp nhận phường cũ có tên bắt đầu bằng tên phường mới
            for (const province of candidates) {
                const districts = await cachedMaster(`districts:${province.provinceId}`, () => this.getDistricts(province.provinceId));
                const found = await this.findWardAcrossDistricts(districts, [wardName], { allowPrefix: true });
                if (found) {
                    return { success: true, provinceId: province.provinceId, districtId: found.districtId, wardCode: found.wardCode };
                }
            }
            return firstFailure;
        } catch (error) {
            throw new Error(`Mapping failed: ${error.message}`);
        }
    }
}

export default GHNService;

