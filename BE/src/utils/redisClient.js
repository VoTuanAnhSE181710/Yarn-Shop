import IORedis from 'ioredis';
import { configDotenv } from 'dotenv'

configDotenv();

const redisClient = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || '6379',
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
})

redisClient.on("connect", () => console.log(`Connect to redis successfully`))
redisClient.on("error", (err) => console.log(`Cannot connect to redis: `, err))

export default redisClient;