import { existsSync } from 'node:fs';

const envFile = new URL('../../../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Never run tests against the dev database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
