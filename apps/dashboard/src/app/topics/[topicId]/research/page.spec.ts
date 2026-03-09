import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getTopic = vi.hoisted(() => vi.fn());
const getResearch = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/api-client', () => ({
  getTopic,
  getResearch,
}));
vi.mock('../../../../components/shared/topic-page-header', () => ({
  TopicPageHeader: ({ title }: { title: string }) => React.createElement('header', null, title),
}));

describe('TopicResearchPage', () => {
  beforeEach(() => {
    getTopic.mockResolvedValue({ id: 'topic-1', title: 'Research topic', brief: 'Brief' });
    getResearch.mockResolvedValue({
      summary: 'Structured summary',
      confidenceScore: 0.75,
      sources: [{ url: 'https://example.com', title: 'Example' }],
      keyPoints: [{ point: 'Point 1', importance: 'high' }],
      examples: [{ exampleTitle: 'Example A', exampleBody: 'Body', takeaway: 'Takeaway' }],
    });
  });

  it('renders research summary and sources', async () => {
    const { default: TopicResearchPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicResearchPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('Research topic');
    expect(html).toContain('Structured summary');
    expect(html).toContain('https://example.com');
  });

  it('renders fallback panels when research API fails to provide data', async () => {
    getTopic.mockResolvedValue(null);
    getResearch.mockResolvedValue(null);

    const { default: TopicResearchPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicResearchPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Topic');
    expect(html).toContain('No research artifact yet.');
    expect(html).toContain('No sources stored.');
    expect(html).toContain('No key points stored.');
    expect(html).toContain('No examples stored.');
  });
});
