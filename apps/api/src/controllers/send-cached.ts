import type { Response } from 'express';
import type { Cached } from '../cache/cache';

/** Sends a cached value, exposing where it came from in the `X-Cache` header. */
export function sendCached<T>(res: Response, { value, cache }: Cached<T>) {
  res.setHeader('X-Cache', cache).json(value);
}
