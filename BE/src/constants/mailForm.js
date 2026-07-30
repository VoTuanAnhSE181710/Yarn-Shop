import { configDotenv } from "dotenv";
import { baseEmailTemplate } from "../utils/mailTemplates.js";
configDotenv();



export const generateOTPOptions = (userEmail, userName, otpCode) => {
    const expiryMinutes = 5; 

    return {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `[OG Management] Your Confirmation Code: ${otpCode}`,
        text: `Your confirmation code is ${otpCode}. It expires in ${expiryMinutes} minutes.`,
        html: baseEmailTemplate(
        "Here's the confirmation code you requested",
        otpCode,
        userName,
        `This code will expire in <strong>${expiryMinutes} minutes</strong>.`
        ),
    };
};

export const generateForgotPasswordOptions = (userEmail, userName, resetLink, uuid) => {
    const expiryMinutes = 30 * 60 / 60;

    const buttonLink = `
        <div style="margin-bottom: 20px;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
            Reset Password
            </a>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: left;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;"><strong>For Developer / Swagger Testing:</strong></p>
            <p style="margin: 0; font-size: 14px;">Your UUID Token is:</p>
            <code style="display: block; margin-top: 5px; padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; word-break: break-all;">${uuid}</code>
        </div>
    `;

    return {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "[OG Management] Reset your password",
        text: `Please use this link to reset your password: ${resetLink}. Or use this UUID for Swagger: ${uuid}. Expired in ${expiryMinutes} minutes.`,
        html: baseEmailTemplate(
        "Click the button below to reset your password",
        buttonLink,
        userName,
        `This one-time link will expire in <strong>${expiryMinutes} minutes</strong>.`
        ),
    };
};

