import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const loadTopicOverviewData = vi.fn();

vi.mock('../../../components/topic-detail/topic-overview-data', () => ({ loadTopicOverviewData }));
vi.mock('../../../components/topic-detail/topic-summary-section', () => ({
  TopicSummarySection: () => React.createElement('section', null, 'topic-summary-section'),
}));
vi.mock('../../../components/topic-detail/topic-pipeline-snapshot', () => ({
  TopicPipelineSnapshot: () => React.createElement('section', null, 'topic-pipeline-snapshot'),
}));
vi.mock('../../../components/topic-detail/distribution-panels', () => ({
  DistributionPanels: () => React.createElement('section', null, 'distribution-panels'),
}));
vi.mock('../../../lib/feature-flags', () => ({ isPhaseEnabled: vi.fn().mockReturnValue(true) }));

describe('TopicOverviewPage', () => {
  beforeEach(() => {
    loadTopicOverviewData.mockResolvedValue({
      topic: { id: 'topic-1', title: 'Topic title' },
      research: null,
      draft: null,
      seo: null,
      social: null,
      publications: [],
    });
  });

  it('renders not-found state when API returns no topic', async () => {
    loadTopicOverviewData.mockResolvedValue({ topic: null, research: null, draft: null, seo: null, social: null, publications: [] });
    const { default: TopicOverviewPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicOverviewPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('Topic not found or API is unavailable.');
  });

  it('renders overview panels when topic exists', async () => {
    const { default: TopicOverviewPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicOverviewPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('topic-summary-section');
    expect(html).toContain('topic-pipeline-snapshot');
    expect(html).toContain('distribution-panels');
  });
});
