import { describe, expect, it } from 'vitest';
import { PELOTAS, api, createReport, createUser } from './helpers';

const pelotasBbox = '-52.40,-31.80,-52.30,-31.70';

describe('reports (citizen)', () => {
  it('creates an open report at the given location', async () => {
    const { auth } = await createUser();
    const res = await api()
      .post('/api/reports')
      .set('Authorization', auth)
      .send({ category: 'missing_tactile_paving', description: 'Corner of the square', ...PELOTAS });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      category: 'missing_tactile_paving',
      description: 'Corner of the square',
      status: 'open',
      upvoteCount: 0,
      ...PELOTAS,
    });
  });

  it('requires login to report', async () => {
    const res = await api().post('/api/reports').send({ category: 'pothole', ...PELOTAS });
    expect(res.status).toBe(401);
  });

  it('validates category and coordinates', async () => {
    const { auth } = await createUser();
    const res = await api()
      .post('/api/reports')
      .set('Authorization', auth)
      .send({ category: 'ufo', lat: 200, lng: PELOTAS.lng });

    expect(res.status).toBe(400);
  });

  it('returns only pins inside the bbox, without upvote counts', async () => {
    const { auth } = await createUser();
    const inside = await createReport(auth);
    await createReport(auth, { lat: -30.0346, lng: -51.2177 }); // Porto Alegre

    const res = await api().get(`/api/reports/map?bbox=${pelotasBbox}`).set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: inside.id, category: 'pothole', status: 'open', ...PELOTAS },
    ]);
  });

  it('rejects a malformed bbox', async () => {
    const { auth } = await createUser();
    const res = await api().get('/api/reports/map?bbox=1,2,3').set('Authorization', auth);

    expect(res.status).toBe(400);
  });

  it('returns details with upvotedByMe and 404 for unknown reports', async () => {
    const { auth } = await createUser();
    const report = await createReport(auth);

    const res = await api().get(`/api/reports/${report.id}`).set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.upvotedByMe).toBe(false);

    const missing = await api()
      .get('/api/reports/00000000-0000-4000-8000-000000000000')
      .set('Authorization', auth);
    expect(missing.status).toBe(404);
  });

  it('never exposes who created or changed a report (decision 010)', async () => {
    const citizen = await createUser();
    const agent = await createUser('agent');
    const report = await createReport(citizen.auth);
    await api()
      .patch(`/api/reports/${report.id}/status`)
      .set('Authorization', agent.auth)
      .send({ status: 'fixed' });

    const responses = await Promise.all([
      api().get(`/api/reports/${report.id}`).set('Authorization', citizen.auth),
      api().get(`/api/reports/map?bbox=${pelotasBbox}`).set('Authorization', citizen.auth),
      api().get('/api/reports').set('Authorization', agent.auth),
    ]);
    for (const res of responses) {
      const body = JSON.stringify(res.body);
      expect(body).not.toContain(citizen.user.id);
      expect(body).not.toContain(agent.user.id);
    }
  });
});

describe('upvotes', () => {
  it('upvotes once per citizen, idempotently', async () => {
    const author = await createUser();
    const voter = await createUser();
    const report = await createReport(author.auth);
    const url = `/api/reports/${report.id}/upvote`;

    expect((await api().put(url).set('Authorization', voter.auth)).body).toEqual({
      upvoteCount: 1,
      upvotedByMe: true,
    });
    expect((await api().put(url).set('Authorization', voter.auth)).body.upvoteCount).toBe(1);
    expect((await api().put(url).set('Authorization', author.auth)).body.upvoteCount).toBe(2);

    const details = await api().get(`/api/reports/${report.id}`).set('Authorization', voter.auth);
    expect(details.body).toMatchObject({ upvoteCount: 2, upvotedByMe: true });
  });

  it('removes an upvote, idempotently', async () => {
    const { auth } = await createUser();
    const report = await createReport(auth);
    const url = `/api/reports/${report.id}/upvote`;

    await api().put(url).set('Authorization', auth);
    expect((await api().delete(url).set('Authorization', auth)).body).toEqual({
      upvoteCount: 0,
      upvotedByMe: false,
    });
    expect((await api().delete(url).set('Authorization', auth)).body.upvoteCount).toBe(0);
  });

  it('keeps the count right under concurrent upvotes', async () => {
    const author = await createUser();
    const report = await createReport(author.auth);
    const voters = await Promise.all(Array.from({ length: 10 }, () => createUser()));

    await Promise.all(
      voters.map((v) => api().put(`/api/reports/${report.id}/upvote`).set('Authorization', v.auth)),
    );

    const details = await api().get(`/api/reports/${report.id}`).set('Authorization', author.auth);
    expect(details.body.upvoteCount).toBe(10);
  });
});

describe('reports (agent)', () => {
  it('forbids citizens from listing reports or changing status', async () => {
    const { auth } = await createUser();
    const report = await createReport(auth);

    expect((await api().get('/api/reports').set('Authorization', auth)).status).toBe(403);
    const patch = await api()
      .patch(`/api/reports/${report.id}/status`)
      .set('Authorization', auth)
      .send({ status: 'fixed' });
    expect(patch.status).toBe(403);
  });

  it('lists reports sorted by most upvoted, with filters and pagination', async () => {
    const agent = await createUser('agent');
    const citizens = await Promise.all([createUser(), createUser()]);
    const low = await createReport(agent.auth, { category: 'lighting' });
    const high = await createReport(agent.auth);
    for (const c of citizens) {
      await api().put(`/api/reports/${high.id}/upvote`).set('Authorization', c.auth);
    }
    await api().put(`/api/reports/${low.id}/upvote`).set('Authorization', citizens[0].auth);

    const all = await api().get('/api/reports').set('Authorization', agent.auth);
    expect(all.body.total).toBe(2);
    expect(all.body.items.map((r: { id: string }) => r.id)).toEqual([high.id, low.id]);

    const lighting = await api().get('/api/reports?category=lighting').set('Authorization', agent.auth);
    expect(lighting.body.items.map((r: { id: string }) => r.id)).toEqual([low.id]);

    const page2 = await api().get('/api/reports?pageSize=1&page=2').set('Authorization', agent.auth);
    expect(page2.body.items.map((r: { id: string }) => r.id)).toEqual([low.id]);
  });

  it('marks a report as not_found and records when', async () => {
    const agent = await createUser('agent');
    const report = await createReport(agent.auth);

    const res = await api()
      .patch(`/api/reports/${report.id}/status`)
      .set('Authorization', agent.auth)
      .send({ status: 'not_found' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('not_found');
    expect(res.body.statusChangedAt).toEqual(expect.any(String));

    const open = await api().get('/api/reports?status=open').set('Authorization', agent.auth);
    expect(open.body.total).toBe(0);
  });
});
