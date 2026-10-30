import { describe, expect, it } from 'vitest';
import { api } from './helpers';

describe('GET /api/health', () => {
  it('reports database and cache as ok', async () => {
    const res = await api().get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ db: 'ok', cache: 'ok' });
  });
});
