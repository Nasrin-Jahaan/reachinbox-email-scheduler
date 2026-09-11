import Redis from 'ioredis';
import { env } from './env';

export const redisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log('🔗 Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});
