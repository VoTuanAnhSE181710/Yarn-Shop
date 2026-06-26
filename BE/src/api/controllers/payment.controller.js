import crypto from 'crypto';
import qs from 'qs';
import moment from 'moment';

// ─────────────────────────────────────────────
//  HELPER: Sắp xếp Object theo bảng chữ cái (VNPay bắt buộc)
// ─────────────────────────────────────────────
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// ─────────────────────────────────────────────
//  1. MOMO: TẠO LINK THANH TOÁN
// ─────────────────────────────────────────────
export const createPayment = async (req, res) => {
    try {
        const { amount, orderInfo } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Số tiền không hợp lệ" });
        }

        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const moMoApiUrl = process.env.MOMO_API_URL;

        const timestamp = Date.now().toString();
        const orderId = "YARN" + timestamp;
        const requestId = orderId;
        const requestType = "captureWallet";
        const extraData = "";

        const redirectUrl = "http://localhost:3000/order/success";
        const ipnUrl = "https://webhook.site/test";

        const orderInfoRaw = orderInfo || "Thanh toan don hang Yarn Shop";

        const rawSignature =
            `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfoRaw}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode,
            requestId,
            amount: Number(amount),
            orderId,
            orderInfo: orderInfoRaw,
            redirectUrl,
            ipnUrl,
            requestType,
            extraData,
            signature,
            lang: "vi",
        };

        const response = await fetch(moMoApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (result.resultCode === 0) {
            return res.status(200).json({
                message: "Tạo liên kết thanh toán MoMo thành công",
                payUrl: result.payUrl,
            });
        } else {
            return res.status(400).json({
                message: "Lỗi từ phía MoMo: " + (result.message || "Không xác định"),
                resultCode: result.resultCode,
            });
        }
    } catch (error) {
        console.error("Momo Payment Error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// ─────────────────────────────────────────────
//  2. VNPAY: TẠO LINK THANH TOÁN
// ─────────────────────────────────────────────
export const createVNPayPayment = async (req, res) => {
    try {
        const { amount, orderInfo } = req.body;

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        let vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        const date = new Date();
        const createDate = moment(date).format("YYYYMMDDHHmmss");
        const orderId = moment(date).format("DDHHmmss");

        const ipAddr =
            req.headers["x-forwarded-for"] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            "127.0.0.1";

        let vnp_Params = {};
        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = "vn";
        vnp_Params["vnp_CurrCode"] = "VND";
        vnp_Params["vnp_TxnRef"] = orderId;
        vnp_Params["vnp_OrderInfo"] = orderInfo || "Thanh toan don hang Yarn Shop";
        vnp_Params["vnp_OrderType"] = "other";
        vnp_Params["vnp_Amount"] = amount * 100; // VNPay yêu cầu * 100
        vnp_Params["vnp_ReturnUrl"] = returnUrl;
        vnp_Params["vnp_IpAddr"] = ipAddr;
        vnp_Params["vnp_CreateDate"] = createDate;

        // Sắp xếp theo alphabet
        vnp_Params = sortObject(vnp_Params);

        // Tạo chữ ký
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        vnp_Params["vnp_SecureHash"] = signed;
        vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

        return res.status(200).json({
            message: "Tạo link thanh toán VNPay thành công",
            payUrl: vnpUrl,
        });
    } catch (error) {
        console.error("Lỗi tạo thanh toán VNPay:", error);
        return res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};

// ─────────────────────────────────────────────
//  3. VNPAY: WEBHOOK (IPN) - NHẬN KẾT QUẢ
// ─────────────────────────────────────────────
export const handleVNPayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];

        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASH_SECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });

        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params["vnp_TxnRef"];
            const rspCode = vnp_Params["vnp_ResponseCode"];

            if (rspCode === "00") {
                console.log(`[VNPay] Thanh toán thành công đơn hàng: ${orderId}`);
                // TODO: Update trạng thái đơn hàng trong DB thành PAID
                return res.status(200).json({ RspCode: "00", Message: "Thành công" });
            } else {
                console.log(`[VNPay] Giao dịch thất bại đơn hàng: ${orderId}, code: ${rspCode}`);
                // TODO: Update trạng thái đơn hàng thành FAILED
                return res.status(200).json({ RspCode: "00", Message: "Thành công" });
            }
        } else {
            return res.status(200).json({ RspCode: "97", Message: "Chữ ký không hợp lệ" });
        }
    } catch (error) {
        console.error("Lỗi IPN VNPay:", error);
        return res.status(200).json({ RspCode: "99", Message: "Lỗi không xác định" });
    }
};