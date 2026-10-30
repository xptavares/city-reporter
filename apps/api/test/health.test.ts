import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { sequelize } from '../src/db/sequelize';
import { redis } from '../src/cache/redis';

afterAll(async () => {
  await sequelize.close();
  redis.disconnect();
});

describe('GET /api/health', () => {
  it('reports database and cache as ok', async () => {
    const res = await request(createApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ db: 'ok', cache: 'ok' });
  });
});
