import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    include: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
  },
});
