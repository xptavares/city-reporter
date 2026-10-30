import { afterEach, describe, expect, it, vi } from 'vitest';
import { redis } from '../src/cache/redis';
import { keys } from '../src/cache/keys';
import { api, createReport, createUser } from './helpers';

const mapUrl = '/api/reports/map?bbox=-52.40,-31.80,-52.30,-31.70';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Redis cache', () => {
  it('serves the map from cache and shows new reports right away', async () => {
    const { auth } = await createUser();
    await createReport(auth);

    const first = await api().get(mapUrl).set('Authorization', auth);
    const second = await api().get(mapUrl).set('Authorization', auth);
    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body).toHaveLength(1);

    await createReport(auth, { category: 'lighting' });
    const afterCreate = await api().get(mapUrl).set('Authorization', auth);
    expect(afterCreate.headers['x-cache']).toBe('MISS');
    expect(afterCreate.body).toHaveLength(2);
  });

  it('does not invalidate the map on upvotes', async () => {
    const { auth } = await createUser();
    const report = await createReport(auth);
    await api().get(mapUrl).set('Authorization', auth);

    await api().put(`/api/reports/${report.id}/upvote`).set('Authorization', auth);

    expect((await api().get(mapUrl).set('Authorization', auth)).headers['x-cache']).toBe('HIT');
  });

  it('caches report details and refreshes them after an upvote', async () => {
    const author = await createUser();
    const voter = await createUser();
    const report = await createReport(author.auth);
    const url = `/api/reports/${report.id}`;

    await api().get(url).set('Authorization', author.auth);
    const hit = await api().get(url).set('Authorization', voter.auth);
    expect(hit.headers['x-cache']).toBe('HIT');

    await api().put(`${url}/upvote`).set('Authorization', voter.auth);

    const author2 = await api().get(url).set('Authorization', author.auth);
    const voter2 = await api().get(url).set('Authorization', voter.auth);
    expect(author2.body).toMatchObject({ upvoteCount: 1, upvotedByMe: false });
    // upvotedByMe is per user, never taken from the shared cache entry.
    expect(voter2.body).toMatchObject({ upvoteCount: 1, upvotedByMe: true });
  });

  it('never stores per-user or identifying fields in Redis', async () => {
    const { user, auth } = await createUser();
    const report = await createReport(auth);
    await api().get(`/api/reports/${report.id}`).set('Authorization', auth);

    const stored = await redis.get(keys.report(report.id));
    expect(stored).not.toBeNull();
    expect(stored).not.toContain('upvotedByMe');
    expect(stored).not.toContain(user.id);
  });

  it('re-sorts the agent list after an upvote', async () => {
    const agent = await createUser('agent');
    const citizen = await createUser();
    const a = await createReport(agent.auth);
    const b = await createReport(agent.auth);
    await api().get('/api/reports?sort=upvotes').set('Authorization', agent.auth);

    await api().put(`/api/reports/${a.id}/upvote`).set('Authorization', citizen.auth);

    const list = await api().get('/api/reports?sort=upvotes').set('Authorization', agent.auth);
    expect(list.headers['x-cache']).toBe('MISS');
    expect(list.body.items.map((r: { id: string }) => r.id)).toEqual([a.id, b.id]);
  });

  it('updates map pins and details when an agent changes the status', async () => {
    const agent = await createUser('agent');
    const report = await createReport(agent.auth);
    await api().get(mapUrl).set('Authorization', agent.auth);
    await api().get(`/api/reports/${report.id}`).set('Authorization', agent.auth);

    await api()
      .patch(`/api/reports/${report.id}/status`)
      .set('Authorization', agent.auth)
      .send({ status: 'fixed' });

    const map = await api().get(mapUrl).set('Authorization', agent.auth);
    const details = await api().get(`/api/reports/${report.id}`).set('Authorization', agent.auth);
    expect(map.body[0].status).toBe('fixed');
    expect(details.body.status).toBe('fixed');
  });

  it('caches /auth/me', async () => {
    const { auth } = await createUser();

    expect((await api().get('/api/auth/me').set('Authorization', auth)).headers['x-cache']).toBe('MISS');
    expect((await api().get('/api/auth/me').set('Authorization', auth)).headers['x-cache']).toBe('HIT');
  });

  it('keeps working from Postgres when Redis is down (fail-open)', async () => {
    const { auth } = await createUser();
    const report = await createReport(auth);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const method of ['get', 'mget', 'set', 'del', 'incr'] as const) {
      vi.spyOn(redis, method).mockRejectedValue(new Error('Redis is down') as never);
    }

    const map = await api().get(mapUrl).set('Authorization', auth);
    const details = await api().get(`/api/reports/${report.id}`).set('Authorization', auth);
    const upvote = await api().put(`/api/reports/${report.id}/upvote`).set('Authorization', auth);

    expect(map.status).toBe(200);
    expect(map.headers['x-cache']).toBe('BYPASS');
    expect(map.body).toHaveLength(1);
    expect(details.status).toBe(200);
    expect(details.headers['x-cache']).toBe('BYPASS');
    expect(upvote.body.upvoteCount).toBe(1);
  });
});
