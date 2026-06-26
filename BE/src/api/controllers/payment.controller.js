import crypto from 'crypto';
import qs from 'qs';
import moment from 'moment';
import { verifyVNPaySignature } from '../../utils/vnpayHelper.js';
import Order from '../../models/order.js';

// ─────────────────────────────────────────────
//  HELPER: Sort object keys alphabetically (VNPay requirement)
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
//  1. MOMO: CREATE PAYMENT LINK
// ─────────────────────────────────────────────
export const createPayment = async (req, res) => {
    try {
        const { amount, orderInfo } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Invalid amount" });
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

        const orderInfoRaw = orderInfo || "Yarn Shop order payment";

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
                message: "MoMo payment link created successfully",
                payUrl: result.payUrl,
            });
        } else {
            return res.status(400).json({
                message: "MoMo error: " + (result.message || "Unknown error"),
                resultCode: result.resultCode,
            });
        }
    } catch (error) {
        console.error("Momo Payment Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// ─────────────────────────────────────────────
//  2. VNPAY: CREATE PAYMENT LINK
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

        let ipAddr =
            req.headers["x-forwarded-for"] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            "127.0.0.1";

        // x-forwarded-for may contain multiple IPs; VNPay only accepts a single IP
        if (ipAddr.includes(",")) {
            ipAddr = ipAddr.split(",")[0].trim();
        }

        let vnp_Params = {};
        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = "vn";
        vnp_Params["vnp_CurrCode"] = "VND";
        vnp_Params["vnp_TxnRef"] = orderId;
        vnp_Params["vnp_OrderInfo"] = orderInfo || "Yarn shop order payment";
        vnp_Params["vnp_OrderType"] = "other";
        vnp_Params["vnp_Amount"] = amount * 100; // VNPay requires amount * 100
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

        return res.status(200).json({
            message: "VNPay payment link created successfully",
            payUrl: vnpUrl,
        });
    } catch (error) {
        console.error("Error creating VNPay payment link:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// ─────────────────────────────────────────────
//  3. VNPAY: IPN WEBHOOK - RECEIVE PAYMENT RESULT
// ─────────────────────────────────────────────
export const handleVNPayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const isValid = verifyVNPaySignature(vnp_Params);

        if (isValid) {
            const orderId = vnp_Params["vnp_TxnRef"];
            const rspCode = vnp_Params["vnp_ResponseCode"];
            const transactionNo = vnp_Params["vnp_TransactionNo"];

            if (rspCode === "00") {
                console.log(`[VNPay] Payment successful for order: ${orderId}`);
                // Update order payment status to PAID in DB
                await Order.findByIdAndUpdate(orderId, {
                    "payment.status": "PAID",
                    "payment.transactionNo": transactionNo,
                    "payment.paidAt": new Date(),
                });
                return res.status(200).json({ RspCode: "00", Message: "Success" });
            } else {
                console.log(`[VNPay] Payment failed for order: ${orderId}, code: ${rspCode}`);
                // Update order payment status to FAILED
                await Order.findByIdAndUpdate(orderId, {
                    "payment.status": "FAILED",
                    "payment.transactionNo": transactionNo,
                });
                return res.status(200).json({ RspCode: "00", Message: "Success" });
            }
        } else {
            return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
        }
    } catch (error) {
        console.error("VNPay IPN error:", error);
        return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
};
