/**
 * Email Service Class
 * Xử lý gửi email
 */

import nodemailer from 'nodemailer';

export default class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    /**
     * Gửi email
     */
    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                html
            });
            return info;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    /**
     * Gửi email chào mừng
     */
    async sendWelcomeEmail(email, name) {
        const subject = 'Welcome to Oil & Gas Management System';
        const html = `
            <h1>Welcome, ${name}!</h1>
            <p>Your account has been created successfully.</p>
        `;
        return await this.sendEmail(email, subject, html);
    }

    /**
     * Gửi email reset password
     */
    async sendPasswordResetEmail(email, resetLink) {
        const subject = 'Password Reset Request';
        const html = `
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link will expire in 15 minutes.</p>
        `;
        return await this.sendEmail(email, subject, html);
    }
}
