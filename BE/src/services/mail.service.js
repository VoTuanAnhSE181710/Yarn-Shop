import crypto from 'crypto'
import { configDotenv } from 'dotenv'
import { BadRequestError } from '../error/error.js';
import { generateForgotPasswordOptions, generateOTPOptions } from '../constants/mailForm.js';

configDotenv();

const OTP_EXPIRATION_SECONDS = 300;
const OTP_VERIFIED_SECONDS = 600;

const OTL_ACCESS_SECONDS = 30 * 60;

class MailService {
    #redis;
    #transporter;
    #userRepository;

    constructor({
        redis,
        transporter,
        userRepository,
    }){
        this.#redis = redis;
        this.#transporter = transporter;
        this.#userRepository = userRepository;
    }

    sentOTPEmail = async ({ email, userId }) => {
        if (typeof email !== 'string' || email.trim() === "") {
            throw new BadRequestError(`invalid email format`)
        }

        const existingUser = await this.#userRepository.findUserById({ userId });

        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail !== existingUser.email) {
            throw new BadRequestError(`please provide the right user email`)
        }

        const otpKey = `otp:${normalizedEmail}`;
        const verifiedKey = `otp:verified:${normalizedEmail}`;

        const otp = crypto.randomInt(100000, 999999).toString();

        const mailOptions = generateOTPOptions(normalizedEmail, existingUser.fullName, otp)

        await this.#transporter.sendMail({ mailOptions });

        await Promise.all([
            this.#redis.del(verifiedKey),
            this.#redis.setex(otpKey, OTP_EXPIRATION_SECONDS, otp)
        ])
    }

    verifyOTPEmail = async ({
        email,
        otp,
        userId,
    }) => {
        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            email.trim() === "" ||
            otp.trim() === ""
        ) {
            return false
        }

        const existingUser = await this.#userRepository.findUserById({ userId })

        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail !== existingUser.email) {
            throw new BadRequestError(`please provide the right user email`)
        }

        const normalizedOtp = otp.trim();

        const otpKey = `otp:${normalizedEmail}`;
        const verifiedKey = `otp:verified:${normalizedEmail}`

        const storedOTP = await this.#redis.get(otpKey);

        if (!storedOTP || storedOTP != normalizedOtp) {
            return false;
        }

        await Promise.all([
            this.#redis.del(otpKey),
            this.#redis.setex(verifiedKey, OTP_VERIFIED_SECONDS, "true"),
        ])

        return true;
    }

    isOTPVerified = async ({ email }) => {
        if (typeof email !== 'string' || email.trim() === "") {
            return false;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const verifiedKey = `otp:verified:${normalizedEmail}`;

        const verified = await this.#redis.get(verifiedKey);

        return verified === 'true'
    }

    clearVerifiedOTP = async ({ email }) => {
        if (typeof email !== 'string' || email.trim() === "") {
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const verifiedKey = `otp:verified:${normalizedEmail}`;

        await this.#redis.del(verifiedKey)
    }

    sendForgotPasswordLink = async ({ email }) => {
        if (typeof email !== 'string' || email.trim() === "") {
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await this.#userRepository.findUserByEmail({ email: normalizedEmail });

        if (!existingUser) {
            throw new BadRequestError(`User not found`);
        }

        const uuid = crypto.randomUUID();

        const resetPasswordAccessKey = `reset_password_access:${uuid}`;

        const resetPasswordLink = `${process.env.FRONTEND_URL}?uuid=${uuid}`

        const mailOptions = generateForgotPasswordOptions(normalizedEmail, existingUser.fullName, resetPasswordLink)

        await this.#transporter.sendMail({ mailOptions });

        await this.#redis.setex(resetPasswordAccessKey, OTL_ACCESS_SECONDS, normalizedEmail)
    }

    verifyAccessLinkKey = async ({ uuid }) => {
        const resetPasswordAccessKey = `reset_password_access:${uuid}`;

        const email = await this.#redis.get(resetPasswordAccessKey);

        if (!email) {
            return null;
        }

        return email;
    }

    clearVerifiedAccessLinkKey = async ({ uuid }) => {
        const resetPasswordAccessKey = `reset_password_access:${uuid}`;

        const isDelete = await this.#redis.del(resetPasswordAccessKey);

        return isDelete;
    }
}

export default MailService