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

export const generateForgotPasswordOptions = (userEmail, userName, resetLink) => {
    const expiryMinutes = 30 * 60 / 60;

    const buttonLink = `
        <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
        Reset Password
        </a>
    `;

    return {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "[OG Management] Reset your password",
        text: `Please use this link to reset your password: ${resetLink}. Expired in ${expiryMinutes} minutes.`,
        html: baseEmailTemplate(
        "Click the button below to reset your password",
        buttonLink,
        userName,
        `This one-time link will expire in <strong>${expiryMinutes} minutes</strong>.`
        ),
    };
};

