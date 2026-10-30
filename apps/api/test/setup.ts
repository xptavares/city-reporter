import { afterAll, beforeEach } from 'vitest';
import { useTestEnv } from './env';

useTestEnv();

const { sequelize } = await import('../src/db/sequelize');
const { redis } = await import('../src/cache/redis');

beforeEach(async () => {
  await sequelize.query('TRUNCATE upvotes, reports, users CASCADE');
  await redis.flushdb();
});

afterAll(async () => {
  await sequelize.close();
  redis.disconnect();
});
