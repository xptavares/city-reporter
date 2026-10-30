import { describe, expect, it } from 'vitest';
import { api, createUser } from './helpers';

const newCitizen = { name: 'Maria', email: 'Maria@Example.com', password: 'password123' };

describe('auth', () => {
  it('registers a citizen and returns a token without the password hash', async () => {
    const res = await api().post('/api/auth/register').send(newCitizen);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: expect.any(String),
      name: 'Maria',
      email: 'maria@example.com',
      role: 'citizen',
    });
  });

  it('ignores attempts to self-register as agent', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...newCitizen, role: 'agent' });

    expect(res.body.user.role).toBe('citizen');
  });

  it('rejects a duplicate email', async () => {
    await api().post('/api/auth/register').send(newCitizen);
    const res = await api().post('/api/auth/register').send(newCitizen);

    expect(res.status).toBe(409);
  });

  it('rejects invalid input with validation issues', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'M', email: 'nope', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.issues.map((i: { path: string }) => i.path).sort()).toEqual([
      'email',
      'name',
      'password',
    ]);
  });

  it('logs in and returns the current user from /me', async () => {
    await api().post('/api/auth/register').send(newCitizen);
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', password: 'password123' });
    expect(login.status).toBe(200);

    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('maria@example.com');
  });

  it('rejects a wrong password with a generic message', async () => {
    await api().post('/api/auth/register').send(newCitizen);
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'maria@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('requires a valid token', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set('Authorization', 'Bearer junk')).status).toBe(401);
  });

  it('returns an agent role for seeded agents', async () => {
    const { auth } = await createUser('agent');
    const me = await api().get('/api/auth/me').set('Authorization', auth);

    expect(me.body.role).toBe('agent');
  });
});
