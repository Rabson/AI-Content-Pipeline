import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

vi.mock('../../../../lib/api-client', () => ({
  getTopic: vi.fn().mockResolvedValue({ id: 'topic-1', title: 'Publish topic' }),
  getSeo: vi.fn().mockResolvedValue(null),
  getLinkedInDraft: vi.fn().mockResolvedValue(null),
  getPublications: vi.fn().mockResolvedValue([]),
  getPublicationOptions: vi.fn().mockResolvedValue({
    canReassignOwner: true,
    owner: { id: 'user-1', email: 'normal_user@example.com', role: 'USER' },
    channels: [],
  }),
  getTopicAssets: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../../lib/api-client/user-api', () => ({
  getUsers: vi.fn().mockResolvedValue([{ id: 'user-1', email: 'normal_user@example.com', role: 'USER' }]),
}));
vi.mock('../../../../lib/auth', () => ({
  getDashboardUser: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', authorized: true }),
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
  it('renders publish controls and owner assignment for admins', async () => {
    const { default: TopicPublishPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicPublishPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Publish topic');
    expect(html).toContain('publish-actions');
    expect(html).toContain('owner-assignment-panel');
  });
});
