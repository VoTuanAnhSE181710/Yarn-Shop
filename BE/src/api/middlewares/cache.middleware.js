import redisClient from "../../utils/redisClient.js";

/**
 * Middleware to cache API responses using Redis.
 * @param {number} durationInSeconds - Cache duration in seconds.
 */
export const cacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        // Use originalUrl to include query params in the cache key
        const key = `cache:${req.originalUrl}`;

        try {
            const cachedData = await redisClient.get(key);
            
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }

            // Override res.json to intercept and cache the response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setex(key, durationInSeconds, JSON.stringify(body)).catch(err => {
                        console.error("Redis Cache Set Error:", err);
                    });
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error("Redis Cache Get Error:", error);
            next();
        }
    };
};
