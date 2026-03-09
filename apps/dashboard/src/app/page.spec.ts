import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

vi.mock('../components/home/home-data', () => ({
  loadHomePageData: vi.fn().mockResolvedValue({ topics: [], suggestions: [] }),
  getAverageConfidence: vi.fn().mockReturnValue(0),
}));
vi.mock('../components/home/hero-section', () => ({
  HeroSection: ({ topicCount }: { topicCount: number }) =>
    React.createElement('section', null, `hero-topics:${topicCount}`),
}));
vi.mock('../components/home/home-panels', () => ({
  RecentTopicsPanel: () => React.createElement('section', null, 'recent-topics-panel'),
  DiscoveryPanel: () => React.createElement('section', null, 'discovery-panel'),
}));

describe('HomePage', () => {
  it('renders the hero and summary panels', async () => {
    const { default: HomePage } = await import('./page');
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain('hero-topics:0');
    expect(html).toContain('recent-topics-panel');
    expect(html).toContain('discovery-panel');
  });
});
