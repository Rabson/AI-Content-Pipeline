import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getTopic = vi.hoisted(() => vi.fn());
const getSeo = vi.hoisted(() => vi.fn());
const getLinkedInDraft = vi.hoisted(() => vi.fn());
const getPublications = vi.hoisted(() => vi.fn());
const getPublicationOptions = vi.hoisted(() => vi.fn());
const getTopicAssets = vi.hoisted(() => vi.fn());
const getUsers = vi.hoisted(() => vi.fn());
const getDashboardUser = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/api-client', () => ({
  getTopic,
  getSeo,
  getLinkedInDraft,
  getPublications,
  getPublicationOptions,
  getTopicAssets,
}));
vi.mock('../../../../lib/api-client/user-api', () => ({
  getUsers,
}));
vi.mock('../../../../lib/auth', () => ({
  getDashboardUser,
}));
vi.mock('../../../../lib/feature-flags', () => ({ isPhaseEnabled: vi.fn().mockReturnValue(true) }));
vi.mock('../../../../components/shared/topic-page-header', () => ({
  TopicPageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) =>
    React.createElement('header', null, title, actions),
}));
vi.mock('./publish-actions', () => ({
  PublishActions: () => React.createElement('div', null, 'publish-actions'),
}));
vi.mock('./publish-panels', () => ({
  BannerPanel: () => React.createElement('section', null, 'banner-panel'),
  DistributionPanel: () => React.createElement('section', null, 'distribution-panel'),
  OwnerAssignmentPanel: () => React.createElement('section', null, 'owner-assignment-panel'),
  PublicationHistoryPanel: () => React.createElement('section', null, 'publication-history-panel'),
  PublishReadinessPanel: () => React.createElement('section', null, 'publish-readiness-panel'),
}));

describe('TopicPublishPage', () => {
  beforeEach(() => {
    getTopic.mockReset();
    getSeo.mockReset();
    getLinkedInDraft.mockReset();
    getPublications.mockReset();
    getPublicationOptions.mockReset();
    getTopicAssets.mockReset();
    getUsers.mockReset();
    getDashboardUser.mockReset();
    getTopic.mockResolvedValue({ id: 'topic-1', title: 'Publish topic' });
    getSeo.mockResolvedValue(null);
    getLinkedInDraft.mockResolvedValue(null);
    getPublications.mockResolvedValue([]);
    getPublicationOptions.mockResolvedValue({
      canReassignOwner: true,
      owner: { id: 'user-1', email: 'normal_user@example.com', role: 'USER' },
      channels: [],
    });
    getTopicAssets.mockResolvedValue([]);
    getUsers.mockResolvedValue([{ id: 'user-1', email: 'normal_user@example.com', role: 'USER' }]);
    getDashboardUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', authorized: true });
  });

  it('renders publish controls and owner assignment for admins', async () => {
    const { default: TopicPublishPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicPublishPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Publish topic');
    expect(html).toContain('publish-actions');
    expect(html).toContain('owner-assignment-panel');
  });

  it('hides owner reassignment for non-admin users', async () => {
    getDashboardUser.mockResolvedValue({ id: 'editor-1', role: 'EDITOR', email: 'editor@example.com', authorized: true });
    getPublicationOptions.mockResolvedValue({
      canReassignOwner: false,
      owner: { id: 'user-1', email: 'normal_user@example.com', role: 'USER' },
      channels: [],
    });

    const { default: TopicPublishPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicPublishPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Publish topic');
    expect(html).toContain('publish-actions');
    expect(html).not.toContain('owner-assignment-panel');
    expect(getUsers).not.toHaveBeenCalled();
  });
});
