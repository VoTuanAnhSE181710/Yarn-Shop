// import RefreshToken from "../models/RefreshToken.js";
import { configDotenv } from "dotenv";
configDotenv()

const REFRESH_TOKEN_EXPIRED_SECONDS = 7 * 24 * 60 * 60

class RefreshTokenRepository {
    #redis;

    constructor({ redis }){
        this.#redis = redis;
    }
    //login
    // async saveToken({
    //     userId,
    //     refreshToken,
    //     expiredAt,
    // }) {
    //     return await RefreshToken.create({
    //         userId,
    //         refreshToken,
    //         expiredAt,
    //     });
    // }

    // //tim token de cap accesstoken moi
    // async findToken(token) {
    //     return await RefreshToken.findOne({ token })
    //     .populate("userId")
    //     .lean();
    // }

    // async deleteToken(token) {
    //     return await RefreshToken.deleteOne({ token })
    // }

    // //su dung khi changepassword va logout toan bo thiet bi
    // async deleteAllTokenByUserId(userId) {
    //     return await RefreshToken.deleteMany({ userId })
    // }

    // saveRefreshToken = async ({
    //     userId,
    //     refreshToken,
    //     expiresIn = REFRESH_TOKEN_EXPIRED_SECONDS,
    // }) => {
    //     const key = `refresh_token:${userId}`;

    //     try {
    //         await this.#redis.setex(key, expiresIn, refreshToken);
    //         return true;
    //     } catch (error) {
    //         console.log(`Error saving refresh token to Redis: ${error}`);
    //         throw error;
    //     }
    // }


    

    
    saveMultiRefreshToken = async ({
        userId,
        refreshToken,
        deviceId,
        deviceName,
        expiresIn = REFRESH_TOKEN_EXPIRED_SECONDS,
    }) => {
        try {
            const key = `refresh_token:${userId}:${deviceId}`;

            const devicesKey = `user_devices:${userId}`;

            const deviceInfoKey = `devices_info:${userId}:${deviceId}`;

            await Promise.all([
                this.#redis.setex(key, expiresIn, refreshToken),

                this.#redis.sadd(devicesKey, deviceId),

                this.#redis.hset(deviceInfoKey, {
                    name: deviceName,
                    lastActive: new Date().toLocaleString('vi-VN'),
                }),

                this.#redis.expire(devicesKey, expiresIn),
                this.#redis.expire(deviceInfoKey, expiresIn),
            ]);
            return true;
        } catch (error) {
            console.log(`Cannot save refreshToken to redis: ${error}`);
            throw error;
        }
    }

    findRefreshToken = async ({ 
        refreshToken, 
        userId,
        deviceId
    }) => {
        const key = `refresh_token:${userId}:${deviceId}`;

        try {
            const storedRefreshToken = await this.#redis.get(key);

            if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
                return null;
            }

            return { refreshToken: storedRefreshToken };
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    deleteRefreshToken = async ({
        userId,
        deviceId,
    }) => {
        const key = `refresh_token:${userId}:${deviceId}`

        const devicesKey = `user_devices:${userId}`
        
        const deviceInfoKey = `devices_info:${userId}:${deviceId}`
        try {
            const deletedCount = await this.#redis.del(key);
            
            if (deletedCount > 0) {
                await Promise.all([
                    this.#redis.srem(devicesKey, deviceId),
                    this.#redis.del(deviceInfoKey)
                ]);
            }

            return deletedCount;
        } catch (error) {
            console.log(`cannot delete refresh token in redis: ${error}`);
            throw error;
        }
    }


    //for reset pass hoac change pass
    deleteAllRefreshToken = async ({ userId }) => {
        const devicesKey = `user_devices:${userId}`

        try {
            const devices = await this.#redis.smembers(devicesKey)

            if (devices && devices.length > 0) {
                const deletePromises = devices.map(deviceId => 
                    Promise.all([
                        this.#redis.del(`refresh_token:${userId}:${deviceId}`),
                        this.#redis.del(`devices_info:${userId}:${deviceId}`),
                    ])
                );
                await Promise.all(deletePromises)
            }

            await this.#redis.del(devicesKey)
            
            return devices.length;
        } catch (error) {
            console.log(`cannot delete all refresh tokens in redis: ${error}`);
            throw error;
        }
    }

    //de admin quan ly user
    getActiveDevices = async ({ userId }) => {

    }

    verifyDeviceId = async ({
        userId,
        deviceId,
    }) => {
        
        const key = `refresh_token:${userId}:${deviceId}`;

        try {
            const exists = await this.#redis.exists(key);
            return exists;
        } catch (error) {
            console.log(`Cannot verify deviceId in redis server: ${error}`);
            throw error;
        }
    }

    verifyOwner = async ({
        userId,
        deviceId,
    }) => {
        try {
            const devicesKey = `user_devices:${userId}`
    
            const isOwner = await this.#redis.sismember(devicesKey, deviceId)
            return isOwner;
        } catch (error) {
            console.log(`Cannot verify owner from redis: ${error}`);
            throw error
        }
    }
}

export default RefreshTokenRepository;