import request from 'supertest';
import type { Role } from '@city-reporter/shared';
import { createApp } from '../src/app';
import { User } from '../src/models';
import { hashPassword } from '../src/services/auth-service';
import { signToken } from '../src/middleware/auth';

export const app = createApp();
export const api = () => request(app);

let userSeq = 0;

/** Creates a user directly in the DB and returns a ready-to-use bearer token. */
export async function createUser(role: Role = 'citizen') {
  userSeq += 1;
  const user = await User.create({
    name: `User ${userSeq}`,
    email: `user${userSeq}@test.local`,
    passwordHash: await hashPassword('password123'),
    role,
  });
  return { user, auth: `Bearer ${signToken({ id: user.id, role: user.role })}` };
}

/** Pelotas downtown. */
export const PELOTAS = { lat: -31.7654, lng: -52.3376 };

export async function createReport(auth: string, overrides: Record<string, unknown> = {}) {
  const res = await api()
    .post('/api/reports')
    .set('Authorization', auth)
    .send({ category: 'pothole', ...PELOTAS, ...overrides });
  if (res.status !== 201) throw new Error(`createReport failed: ${JSON.stringify(res.body)}`);
  return res.body as { id: string; upvoteCount: number };
}
