import { describe, expect, it } from 'vitest';
import { WORKER_INTERNAL_ROUTE_PREFIX, WORKER_INTERNAL_ROUTES } from './worker-internal-routes';

describe('worker internal routes', () => {
  it('keeps all worker endpoint paths under the internal prefix', () => {
    const paths = Object.values(WORKER_INTERNAL_ROUTES).map((route) => route.path);
    expect(paths.every((path) => path.startsWith(`${WORKER_INTERNAL_ROUTE_PREFIX}/`))).toBe(true);
  });

  it('ensures route paths are unique', () => {
    const paths = Object.values(WORKER_INTERNAL_ROUTES).map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
