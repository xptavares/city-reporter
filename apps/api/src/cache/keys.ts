import { createHash } from 'node:crypto';
import type { Tile } from './tiles';

// Every key the API writes to Redis is built here, so the full key space is visible in one place.
// See "Caching (Redis)" in docs/SYSTEM-ARCHITECTURE.md.

/** Seconds. */
export const TTL = {
  mapTile: 10 * 60,
  report: 10 * 60,
  list: 60,
  user: 10 * 60,
} as const;

/** Key groups invalidated by bumping a version number instead of deleting keys one by one. */
export type VersionedGroup = 'map' | 'list';

export const keys = {
  version: (group: VersionedGroup) => `cr:${group}:ver`,
  mapTile: (version: number, { z, x, y }: Tile) => `cr:map:v${version}:tile:${z}:${x}:${y}`,
  report: (id: string) => `cr:report:${id}`,
  list: (version: number, query: object) => `cr:list:v${version}:${hash(query)}`,
  user: (id: string) => `cr:user:${id}`,
};

function hash(value: object): string {
  // Parsed zod output has a stable key order, so equal queries hash equally.
  return createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}
