import crypto from "crypto";
import qs from "qs";
import moment from "moment";

/**
 * Sort object keys alphabetically and URL-encode values (VNPay requirement)
 * Works with both plain objects and URLSearchParams (req.query in newer Node)
 */
function sortObject(obj) {
    let sorted = {};
    // Get all enumerable keys (works for plain objects, URLSearchParams, etc.)
    const keys = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            keys.push(key);
        }
    }
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        sorted[encodeURIComponent(key)] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

/**
 * Get client IP address, handling proxy chains (x-forwarded-for)
 */
function getClientIp(req) {
    let ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "127.0.0.1";

    if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
    }

    return ip;
}

/**
 * Generate VNPay payment URL
 */
export function generateVNPayUrl(orderId, amount, req) {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const ipAddr = getClientIp(req);

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = `Yarn Shop payment for order ${orderId}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
}

/**
 * Verify VNPay IPN signature
 * Works with both plain objects and URLSearchParams (req.query)
 */
export function verifyVNPaySignature(vnp_Params) {
    const secureHash = vnp_Params["vnp_SecureHash"];
    const secretKey = process.env.VNP_HASH_SECRET;

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return secureHash === signed;
}