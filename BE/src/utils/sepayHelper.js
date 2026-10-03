// Same format as createSePayPayment / handleSePayIPN in payment.controller.js:
// "YARN" + last 6 chars of the order id (upper-cased). The SePay webhook uses it to find the order.
export const buildSePayContent = (orderId) =>
    `YARN${orderId.toString().slice(-6).toUpperCase()}`;

export const generateSePayUrl = (orderId, amount) => {
    const bankAcc = process.env.SEPAY_ACCOUNT;
    const bankName = process.env.SEPAY_BANK;
    if (!bankAcc || !bankName) {
        // Fail loudly instead of generating a QR that pays into a non-existent account
        throw new Error("SePay is not configured: missing SEPAY_ACCOUNT or SEPAY_BANK");
    }
    const content = buildSePayContent(orderId);
    return `https://qr.sepay.vn/img?acc=${bankAcc}&bank=${bankName}&amount=${amount}&des=${content}`;
};
