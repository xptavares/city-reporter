import { Router } from 'express';
import { sequelize } from '../db/sequelize';
import { redis } from '../cache/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const [db, cache] = await Promise.all([
    sequelize.authenticate().then(() => 'ok', () => 'down'),
    redis.ping().then(() => 'ok', () => 'down'),
  ]);
  // Redis is a cache (fail-open), so only the database decides overall health.
  res.status(db === 'ok' ? 200 : 503).json({ db, cache });
});
