import crypto from "crypto";

export const generateMomoUrl = async (orderId, amount) => {
    const orderInfo = `Yarn Shop order ${orderId}`;
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const moMoApiUrl = process.env.MOMO_API_URL;

    if (!partnerCode || !accessKey || !secretKey || !moMoApiUrl) {
        console.warn("Missing MoMo environment variables!");
        return null;
    }

    const timestamp = Date.now().toString();
    const momoOrderId = "YARN" + timestamp;
    const requestId = momoOrderId;
    const requestType = "captureWallet";
    const extraData = Buffer.from(orderId.toString()).toString('base64');

    const redirectUrl = process.env.MOMO_REDIRECT_URL || "https://len-em.vercel.app/order-success";
    const ipnUrl = process.env.MOMO_IPN_URL || "https://yarn-shop-be.onrender.com/api/v1/payment/momo/ipn";

    const rawSignature =
        `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(rawSignature)
        .digest("hex");

    const requestBody = {
        partnerCode,
        requestId,
        amount: Number(amount),
        orderId: momoOrderId,
        orderInfo,
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
        return result.payUrl;
    }
    
    console.error("MoMo Error:", result);
    return null;
};
