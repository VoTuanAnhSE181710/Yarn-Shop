// import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'
import { configDotenv } from 'dotenv'
configDotenv();

if (!process.env.SENDGRID_API_KEY) {
    throw new Error("Missing SendGrid API Key!");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     }
// })

const transporter = {
    sendMail: async ({ mailOptions }) => {
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