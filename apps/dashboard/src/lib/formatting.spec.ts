import { describe, expect, it } from 'vitest';
import { cleanText, formatDate, formatStatus, formatTopicPreview, formatTopicSource, formatUsd } from './formatting';

describe('formatting utilities', () => {
  it('cleans html and decodes entities', () => {
    expect(cleanText('<p>Hello&nbsp;&amp;&nbsp;world &#39;test&#39;</p>')).toBe("Hello & world 'test'");
  });

  it('formats timestamps with explicit UTC context', () => {
    expect(formatDate('2026-03-08T00:15:00.000Z')).toContain('UTC');
  });

  it('formats topic status and source labels for display', () => {
    expect(formatStatus('RESEARCH_IN_PROGRESS')).toBe('Research In Progress');
    expect(formatTopicSource('DISCOVERY_API:hackernews')).toBe('API Hackernews');
    expect(formatTopicSource('DISCOVERY_MANUAL')).toBe('Manual Discovery');
  });

  it('formats topic preview and currency fallback values', () => {
    expect(formatTopicPreview('', 30)).toBe('No brief yet.');
    expect(formatUsd('invalid')).toBe('$0.00');
  });
});
