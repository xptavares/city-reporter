import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    // Tests share one database; run files sequentially.
    fileParallelism: false,
  },
});
