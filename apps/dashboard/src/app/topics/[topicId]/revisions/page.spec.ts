import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getTopic = vi.hoisted(() => vi.fn());
const getRevisionRuns = vi.hoisted(() => vi.fn());
const getRevisionDiff = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/api-client', () => ({
  getTopic,
  getRevisionRuns,
  getRevisionDiff,
}));
vi.mock('../../../../components/shared/topic-page-header', () => ({
  TopicPageHeader: ({ title }: { title: string }) => React.createElement('header', null, title),
}));

describe('TopicRevisionsPage', () => {
  beforeEach(() => {
    getTopic.mockResolvedValue({ id: 'topic-1', title: 'Revisions topic' });
    getRevisionRuns.mockResolvedValue([
      {
        id: 'run-1',
        status: 'COMPLETED',
        createdAt: '2026-03-09T00:00:00Z',
        items: [{ id: 'item-1' }],
        sectionDiffs: [{ sectionKey: 'intro' }],
        fromDraftVersionId: 'from-1',
        toDraftVersionId: 'to-1',
        fromDraftVersion: { versionNumber: 1 },
        toDraftVersion: { versionNumber: 2 },
      },
    ]);
    getRevisionDiff.mockResolvedValue({ sectionDiffs: [{ sectionKey: 'intro', diffUnifiedMd: '@@ -1 +1 @@' }] });
  });

  it('renders revision run list and latest diff', async () => {
    const { default: TopicRevisionsPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicRevisionsPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('Revisions topic');
    expect(html).toContain('Revision runs');
    expect(html).toContain('@@ -1 +1 @@');
  });

  it('renders empty diff states when revision APIs return fallbacks', async () => {
    getTopic.mockResolvedValue(null);
    getRevisionRuns.mockResolvedValue([]);
    getRevisionDiff.mockResolvedValue({ sectionDiffs: [] });

    const { default: TopicRevisionsPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicRevisionsPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Topic');
    expect(html).toContain('No revision runs recorded yet.');
    expect(html).toContain('Run a section revision to populate diffs.');
  });
});
