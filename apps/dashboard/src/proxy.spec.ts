import { describe, expect, it, vi } from 'vitest';

const withAuth = vi.hoisted(() =>
  vi.fn((options: any) => (req: any) => {
    const allowed = options.callbacks.authorized({ token: req.token, req });
    return allowed ? { type: 'next' } : { type: 'redirect', location: options.pages.signIn };
  }),
);

vi.mock('next-auth/middleware', () => ({ withAuth }));

describe('proxy auth integration', () => {
  it('redirects unauthenticated request to signin', async () => {
    const { default: proxy } = await import('./proxy');
    const response = proxy({ token: null } as never, {} as never);
    expect(response).toEqual({ type: 'redirect', location: '/signin' });
  });

  it('allows authenticated request to pass through', async () => {
    const { default: proxy, config } = await import('./proxy');
    const response = proxy({ token: { sub: 'user-1' } } as never, {} as never);
    expect(response).toEqual({ type: 'next' });
    expect(config.matcher[0]).toContain('signin');
  });
});
