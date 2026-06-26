import crypto from "crypto";
import qs from "qs";
import moment from "moment";

/**
 * Sort object keys alphabetically (VNPay requirement)
 */
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

/**
 * Get client IP address, handling proxy chains (x-forwarded-for)
 */
function getClientIp(req) {
    let ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "127.0.0.1";

    // x-forwarded-for may contain multiple IPs (e.g. "client, proxy1, proxy2")
    // VNPay only accepts a single IP, so take the first one
    if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
    }

    return ip;
}

/**
 * Generate VNPay payment URL
 * @param {string} orderId - MongoDB Order _id
 * @param {number} amount - Total amount in VND
 * @param {object} req - Express request object (for IP address)
 * @returns {string} VNPay payment URL
 */
export function generateVNPayUrl(orderId, amount, req) {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const ipAddr = getClientIp(req);

    // Build params - DO NOT include vnp_IpnUrl (VNPay does not support it in API params)
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

    // Sort alphabetically
    vnp_Params = sortObject(vnp_Params);

    // Generate secure hash
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
}

/**
 * Verify VNPay IPN signature
 * @param {object} vnp_Params - Query params from VNPay IPN callback
 * @returns {boolean} Whether signature is valid
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