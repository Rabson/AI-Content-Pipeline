import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardAuthHeaders, getDashboardUser } from './auth';

const getServerSession = vi.hoisted(() => vi.fn());

vi.mock('next-auth', () => ({ getServerSession }));

describe('dashboard auth helpers', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it('returns unauthorized user when no session exists', async () => {
    getServerSession.mockResolvedValue(null);
    const user = await getDashboardUser();
    expect(user.authorized).toBe(false);
    expect(user.email).toBe('');
  });

  it('builds auth headers for authenticated dashboard user', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN', email: 'admin@example.com', apiToken: 'token-1', name: 'Admin' },
    });
    const headers = await getDashboardAuthHeaders();
    expect(headers.Authorization).toBe('Bearer token-1');
    expect(headers['Content-Type']).toBe('application/json');
  });
});
