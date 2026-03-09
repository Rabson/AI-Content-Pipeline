import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const loadReviewPageData = vi.hoisted(() => vi.fn());

vi.mock('../../../../components/review/review-page-data', () => ({
  loadReviewPageData,
}));
vi.mock('../../../../components/review/review-header-actions', () => ({
  ReviewHeaderActions: () => React.createElement('div', null, 'review-header-actions'),
}));
vi.mock('../../../../components/review/section-list-panel', () => ({
  SectionListPanel: () => React.createElement('section', null, 'section-list-panel'),
}));
vi.mock('../../../../components/review/section-review-panel', () => ({
  SectionReviewPanel: () => React.createElement('section', null, 'section-review-panel'),
}));
vi.mock('../../../../components/shared/topic-page-header', () => ({
  TopicPageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => React.createElement('header', null, title, actions),
}));

describe('TopicReviewPage', () => {
  beforeEach(() => {
    loadReviewPageData.mockResolvedValue({
      topic: { id: 'topic-1', title: 'Review topic' },
      draft: { id: 'draft-1' },
      reviewSessions: [{ id: 'session-1', status: 'OPEN' }],
      sectionPayload: { sectionKey: 'intro' },
    });
  });

  it('renders review panels for selected section', async () => {
    const { default: TopicReviewPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicReviewPage({
      params: Promise.resolve({ topicId: 'topic-1' }),
      searchParams: Promise.resolve({ section: 'intro' }),
    }));
    expect(html).toContain('Review topic');
    expect(html).toContain('review-header-actions');
    expect(html).toContain('section-review-panel');
  });

  it('renders fallback title when API data is unavailable', async () => {
    loadReviewPageData.mockResolvedValue({
      topic: null,
      draft: null,
      reviewSessions: [],
      sectionPayload: null,
    });

    const { default: TopicReviewPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicReviewPage({
      params: Promise.resolve({ topicId: 'topic-1' }),
      searchParams: Promise.resolve({}),
    }));

    expect(html).toContain('Topic');
    expect(html).toContain('section-list-panel');
  });
});
