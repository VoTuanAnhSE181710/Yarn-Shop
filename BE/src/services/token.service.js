import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { configDotenv } from 'dotenv'
import { AuthenticationError } from '../error/error.js'
configDotenv();

const SECRET_KEY = process.env.JWT_SECRET
const REFRESH_SECRET_KEY = process.env.REFRESH_JWT_SECRET

class TokenService {
    #refreshTokenRepository;

    constructor({ refreshTokenRepository }) {
        this.#refreshTokenRepository = refreshTokenRepository;
    }

    generateToken({
        userId,
        fullName,
        roleName,
        roleId,
        deviceId,
    }) {
        const jti = crypto.randomUUID();

        const rawDeviceId = crypto.randomUUID()
        const finalDeviceId = deviceId || 
                            `DEVICE_${rawDeviceId.split('-')[0].toUpperCase()}`;

        const accessToken = jwt.sign(
            { userId, roleName, roleId, fullName, deviceId: finalDeviceId, jti},
            SECRET_KEY,
            { expiresIn: "30m" }
        )

        const refreshToken = jwt.sign(
            { userId, deviceId: finalDeviceId, jti },
            REFRESH_SECRET_KEY,
            { expiresIn: "7d"}
        )

        return { accessToken, refreshToken, deviceId: finalDeviceId, jti };
    }

    verifyAccessToken({ token }){
        const decode = jwt.verify(token, SECRET_KEY);
        return decode;
    }

    async verifyRefreshToken({ token }) {
        const decode = jwt.verify(token, REFRESH_SECRET_KEY);

        const tokenInDb = await this.#refreshTokenRepository.findRefreshToken({
            refreshToken: token,
            userId: decode.userId,
            deviceId: decode.deviceId,
        })
        if (!tokenInDb){
            throw new AuthenticationError(`Token Expired!`)
        }
        return decode;
    }

    async saveRefreshToken({ 
        userId ,
        refreshToken,
        deviceId,
        deviceName, 
    }){
        return await this.#refreshTokenRepository.saveMultiRefreshToken({
            userId,
            refreshToken,
            deviceId,
            deviceName,
        })
    }

    async revokeRefreshToken({ userId, deviceId }) {
        return await this.#refreshTokenRepository.deleteRefreshToken({ userId, deviceId })
    }

    // async removeUserRefreshToken(userId){
    //     return await this.#refreshTokenRepository.deleteAllTokenByUserId(userId)
    // }

    async removeAllRefreshToken({
        userId
    }){
        return await this.#refreshTokenRepository.deleteAllRefreshToken({ userId })
    }

    async verifyDeviceId ({
        userId,
        deviceId,
    }){
       return await this.#refreshTokenRepository.verifyDeviceId({
        userId,
        deviceId,
       })
    }

    async verifyOwner ({
        userId,
        deviceId
    }){
        return await this.#refreshTokenRepository.verifyOwner({
            userId,
            deviceId,
        })
    }
}


export default TokenService