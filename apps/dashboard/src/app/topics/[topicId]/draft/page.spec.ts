import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getTopic = vi.hoisted(() => vi.fn());
const getDraft = vi.hoisted(() => vi.fn());
const getReviewSessions = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/api-client', () => ({
  getTopic,
  getDraft,
  getReviewSessions,
}));
vi.mock('../actions', () => ({ approveDraftAction: vi.fn(), createReviewSessionAction: vi.fn() }));
vi.mock('../../../../components/shared/topic-page-header', () => ({
  TopicPageHeader: ({ title }: { title: string }) => React.createElement('header', null, title),
}));

describe('TopicDraftPage', () => {
  beforeEach(() => {
    getTopic.mockResolvedValue({ id: 'topic-1', title: 'Draft topic' });
    getDraft.mockResolvedValue({
      id: 'draft-1',
      assembledMarkdown: '## Markdown',
      sections: [{ sectionKey: 'intro', position: 1, heading: 'Intro', wordCount: 120 }],
    });
    getReviewSessions.mockResolvedValue([]);
  });

  it('renders draft sections and markdown preview', async () => {
    const { default: TopicDraftPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicDraftPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('Draft topic');
    expect(html).toContain('Intro');
    expect(html).toContain('## Markdown');
  });

  it('renders fallback content when API data is unavailable', async () => {
    getTopic.mockResolvedValue(null);
    getDraft.mockResolvedValue(null);
    getReviewSessions.mockResolvedValue([]);

    const { default: TopicDraftPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicDraftPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Topic');
    expect(html).toContain('No draft sections found.');
    expect(html).toContain('Draft markdown not generated yet.');
  });
});
