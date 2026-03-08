import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@api': resolve(__dirname, 'apps/api/src'),
      '@worker': resolve(__dirname, 'apps/worker/src'),
      '@dashboard': resolve(__dirname, 'apps/dashboard/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    include: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
  },
});
