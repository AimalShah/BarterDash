import Redis from 'ioredis';
import { config } from '../config';

/**
 * Redis client setup for BullMQ and caching
 */
export const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis');
});
