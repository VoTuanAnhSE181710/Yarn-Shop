// import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'
import { configDotenv } from 'dotenv'
configDotenv();

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
} else {
    console.warn("⚠️  SENDGRID_API_KEY not configured. Email functionality disabled.");
}

const transporter = {
    sendMail: async ({ mailOptions }) => {
        if (!process.env.SENDGRID_API_KEY) {
            console.warn("Email not sent: SENDGRID_API_KEY not configured");
            return { accepted: [], response: "skipped" };
        }

        const msg = {
            to: mailOptions.to,
            from: mailOptions.from || process.env.EMAIL_USER,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: mailOptions.html,
        };

        const [res] = await sgMail.send(msg);

        return {
            accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
            response: String(res?.statusCode || ""),
        }
    }
}

export default transporter
