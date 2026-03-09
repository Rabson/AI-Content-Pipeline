import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assignTopicOwnerAction, requestPublicationAction, retryPublicationAction } from './actions';

const backendMutation = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const getDashboardUser = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../../lib/backend-client', () => ({ backendMutation }));
vi.mock('../../../lib/auth', () => ({ getDashboardUser }));

describe('topic publish actions authorization', () => {
  beforeEach(() => {
    backendMutation.mockReset();
    revalidatePath.mockReset();
    getDashboardUser.mockReset();
  });

  it('allows admins to reassign owner', async () => {
    getDashboardUser.mockResolvedValue({ authorized: true, role: 'ADMIN', id: 'admin-1', email: 'admin@example.com', apiToken: 'token' });
    backendMutation.mockResolvedValue({ ok: true });
    const formData = new FormData();
    formData.set('ownerUserId', 'user-1');

    await assignTopicOwnerAction('topic-1', formData);

    expect(backendMutation).toHaveBeenCalledWith('/v1/topics/topic-1/owner', expect.objectContaining({ method: 'PATCH' }));
  });

  it('blocks non-admin owner reassignment', async () => {
    getDashboardUser.mockResolvedValue({ authorized: true, role: 'EDITOR', id: 'editor-1', email: 'editor@example.com', apiToken: 'token' });

    const formData = new FormData();
    formData.set('ownerUserId', 'user-1');

    await expect(assignTopicOwnerAction('topic-1', formData)).rejects.toThrow('Owner reassignment requires one of: ADMIN');
    expect(backendMutation).not.toHaveBeenCalled();
  });

  it('allows publish and retry for assigned users', async () => {
    getDashboardUser.mockResolvedValue({ authorized: true, role: 'USER', id: 'user-1', email: 'normal_user@example.com', apiToken: 'token' });
    backendMutation.mockResolvedValue({ ok: true });

    await requestPublicationAction('topic-1', 'DEVTO');
    await retryPublicationAction('topic-1', 'pub-1');

    expect(backendMutation).toHaveBeenNthCalledWith(1, '/v1/topics/topic-1/publications', expect.objectContaining({ method: 'POST' }));
    expect(backendMutation).toHaveBeenNthCalledWith(2, '/v1/topics/topic-1/publications/pub-1/retry', expect.objectContaining({ method: 'POST' }));
  });

  it('blocks publish actions for disallowed roles', async () => {
    getDashboardUser.mockResolvedValue({ authorized: true, role: 'REVIEWER', id: 'reviewer-1', email: 'reviewer@example.com', apiToken: 'token' });

    await expect(requestPublicationAction('topic-1', 'MEDIUM')).rejects.toThrow('Publish request requires one of: ADMIN, USER');
    await expect(retryPublicationAction('topic-1', 'pub-1')).rejects.toThrow('Publication retry requires one of: ADMIN, USER');
    expect(backendMutation).not.toHaveBeenCalled();
  });
});
