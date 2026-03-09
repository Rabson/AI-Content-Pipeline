import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

vi.mock('../../lib/api-client', () => ({
  getTopics: vi.fn().mockResolvedValue([]),
  getDiscoverySuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
}));
vi.mock('../../lib/feature-flags', () => ({ isPhaseEnabled: vi.fn().mockReturnValue(true) }));
vi.mock('../../components/shared/discovery-suggestion-card', () => ({
  DiscoverySuggestionCard: () => React.createElement('div', null, 'discovery-card'),
}));
vi.mock('../../components/shared/topic-summary-card', () => ({
  TopicSummaryCard: () => React.createElement('div', null, 'topic-card'),
}));
vi.mock('./topic-create-form', () => ({
  TopicCreateForm: () => React.createElement('form', null, 'topic-create-form'),
}));

describe('TopicsPage', () => {
  it('renders empty states when topic/discovery APIs return no data', async () => {
    const { default: TopicsPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicsPage());

    expect(html).toContain('topic-create-form');
    expect(html).toContain('No suggestions yet.');
    expect(html).toContain('No topics available.');
  });
});
