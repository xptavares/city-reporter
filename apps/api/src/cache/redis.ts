import { Redis } from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.REDIS_URL, {
  // The cache is fail-open: if Redis is slow or down, commands fail fast and callers
  // fall back to Postgres instead of hanging.
  commandTimeout: 500,
  maxRetriesPerRequest: 1,
});

redis.on('error', (err) => console.warn('[redis]', err.message));
