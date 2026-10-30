import { existsSync } from 'node:fs';

/** Loads the root .env and points the app at the test database and Redis. Run before app imports. */
export function useTestEnv() {
  // Global setup applies this first; test workers inherit the already-switched env.
  if (process.env.CITY_REPORTER_TEST_ENV) return;

  const envFile = new URL('../../../.env', import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  // Tests truncate tables and flush Redis: never let them touch dev data.
  const { TEST_DATABASE_URL, TEST_REDIS_URL, DATABASE_URL, REDIS_URL } = process.env;
  if (!TEST_DATABASE_URL || TEST_DATABASE_URL === DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be set and differ from DATABASE_URL');
  }
  if (!TEST_REDIS_URL || TEST_REDIS_URL === REDIS_URL) {
    throw new Error('TEST_REDIS_URL must be set and differ from REDIS_URL');
  }
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.REDIS_URL = TEST_REDIS_URL;
  process.env.CITY_REPORTER_TEST_ENV = '1';
}
