import { redis } from './redis';
import { keys, type VersionedGroup } from './keys';

// Cache-aside helpers. All of them are fail-open: if Redis errors, the error is logged and the
// value is loaded from Postgres, so a Redis outage only makes the API slower, never broken.

/** HIT: served from Redis. MISS: loaded and stored. BYPASS: Redis unavailable or skipped. */
export type CacheStatus = 'HIT' | 'MISS' | 'BYPASS';
export type Cached<T> = { value: T; cache: CacheStatus };

async function safe<T>(op: () => Promise<T>): Promise<T | undefined> {
  try {
    return await op();
  } catch (err) {
    console.warn('[cache]', (err as Error).message);
    return undefined;
  }
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<Cached<T>> {
  const raw = await safe(() => redis.get(key));
  if (raw === undefined) return { value: await load(), cache: 'BYPASS' };
  if (raw !== null) return { value: JSON.parse(raw) as T, cache: 'HIT' };

  const value = await load();
  await safe(() => redis.set(key, JSON.stringify(value), 'EX', ttlSeconds));
  return { value, cache: 'MISS' };
}

/** Like `cached`, for several keys at once (one MGET). `load(i)` loads the i-th missing value. */
export async function cachedMany<T>(
  keyList: string[],
  ttlSeconds: number,
  load: (index: number) => Promise<T>,
): Promise<Cached<T[]>> {
  const raws = await safe(() => redis.mget(keyList));
  if (raws === undefined) {
    return { value: await Promise.all(keyList.map((_, i) => load(i))), cache: 'BYPASS' };
  }

  let allHit = true;
  const values = await Promise.all(
    raws.map(async (raw, i) => {
      if (raw !== null) return JSON.parse(raw) as T;
      allHit = false;
      const value = await load(i);
      await safe(() => redis.set(keyList[i], JSON.stringify(value), 'EX', ttlSeconds));
      return value;
    }),
  );
  return { value: values, cache: allHit ? 'HIT' : 'MISS' };
}

/** Current version of a key group, or `undefined` if Redis is unavailable. */
export async function getVersion(group: VersionedGroup): Promise<number | undefined> {
  const raw = await safe(() => redis.get(keys.version(group)));
  return raw === undefined ? undefined : Number(raw ?? 0);
}

/** Makes every key of the groups unreachable at once; old keys expire via TTL. */
export async function bumpVersions(...groups: VersionedGroup[]): Promise<void> {
  await Promise.all(groups.map((group) => safe(() => redis.incr(keys.version(group)))));
}

export async function invalidate(...keyList: string[]): Promise<void> {
  await safe(() => redis.del(...keyList));
}
