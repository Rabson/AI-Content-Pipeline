import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getTopic = vi.hoisted(() => vi.fn());
const getOutline = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/api-client', () => ({
  getTopic,
  getOutline,
}));
vi.mock('../../../../components/shared/topic-nav', () => ({
  TopicNav: () => React.createElement('nav', null, 'topic-nav'),
}));

describe('TopicOutlinePage', () => {
  beforeEach(() => {
    getTopic.mockResolvedValue({ id: 'topic-1', title: 'Outline topic' });
    getOutline.mockResolvedValue({
      title: 'Generated outline',
      objective: 'Explain tradeoffs',
      sections: [{ sectionKey: 's1', position: 1, heading: 'Intro', objective: 'Context', targetWords: 200 }],
    });
  });

  it('renders outline sections', async () => {
    const { default: TopicOutlinePage } = await import('./page');
    const html = renderToStaticMarkup(await TopicOutlinePage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('Outline topic');
    expect(html).toContain('Generated outline');
    expect(html).toContain('Intro');
  });

  it('renders fallback outline message when API returns null', async () => {
    getTopic.mockResolvedValue(null);
    getOutline.mockResolvedValue(null);

    const { default: TopicOutlinePage } = await import('./page');
    const html = renderToStaticMarkup(await TopicOutlinePage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Topic');
    expect(html).toContain('No outline available');
  });
});
