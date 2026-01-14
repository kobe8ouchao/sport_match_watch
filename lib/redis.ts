import Redis from 'ioredis';

// Use a singleton pattern to prevent multiple connections in serverless environment
let redis: Redis | null = null;

export function getRedisClient() {
    if (redis) return redis;

    const connectionString = process.env.Sportlive_REDIS_URL || process.env.REDIS_URL || process.env.KV_URL;

    if (!connectionString) {
        console.warn("Redis connection string (Sportlive_REDIS_URL or REDIS_URL) not found.");
        return null;
    }

    try {
        redis = new Redis(connectionString);
        return redis;
    } catch (e) {
        console.error("Failed to initialize Redis client:", e);
        return null;
    }
}
