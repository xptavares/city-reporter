import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@city-reporter/shared';
import { config } from '../config';
import { HttpError } from '../http-error';

export type AuthUser = { id: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type TokenPayload = { sub: string; role: Role };

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1d' });
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Authentication required');

  try {
    const payload = jwt.verify(header.slice('Bearer '.length), config.JWT_SECRET) as TokenPayload;
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  next();
};

export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (req.user?.role !== role) throw new HttpError(403, 'Forbidden');
    next();
  };
}

/** Narrows `req.user` after `requireAuth` has run. */
export function currentUser(req: Express.Request): AuthUser {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}
