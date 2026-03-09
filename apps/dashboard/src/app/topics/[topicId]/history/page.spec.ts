import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getTopic = vi.hoisted(() => vi.fn());
const getResearch = vi.hoisted(() => vi.fn());
const getDraft = vi.hoisted(() => vi.fn());
const getPublications = vi.hoisted(() => vi.fn());
const getWorkflowEvents = vi.hoisted(() => vi.fn());
const getWorkflowRuns = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/api-client', () => ({
  getTopic,
  getResearch,
  getDraft,
  getPublications,
  getWorkflowEvents,
  getWorkflowRuns,
}));
vi.mock('../../../../components/shared/topic-page-header', () => ({
  TopicPageHeader: ({ title }: { title: string }) => React.createElement('header', null, title),
}));

describe('TopicHistoryPage', () => {
  beforeEach(() => {
    getTopic.mockResolvedValue({ id: 'topic-1', title: 'History topic', status: 'APPROVED', createdAt: '2026-03-09T00:00:00Z' });
    getResearch.mockResolvedValue({ summary: 'Research summary' });
    getDraft.mockResolvedValue({ status: 'READY', versionNumber: 2 });
    getPublications.mockResolvedValue([{ id: 'pub-1', channel: 'DEVTO', status: 'PUBLISHED', externalUrl: 'https://dev.to/x' }]);
    getWorkflowEvents.mockResolvedValue([{ id: 'evt-1', eventType: 'COMPLETED', stage: 'DRAFT', createdAt: '2026-03-09T01:00:00Z' }]);
    getWorkflowRuns.mockResolvedValue([{ id: 'run-1', stage: 'DRAFT', status: 'COMPLETED', startedAt: '2026-03-09T00:00:00Z', events: [] }]);
  });

  it('renders workflow history panels', async () => {
    const { default: TopicHistoryPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicHistoryPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));
    expect(html).toContain('History topic');
    expect(html).toContain('Workflow events');
    expect(html).toContain('Publication ledger');
  });

  it('renders empty states when API returns fallbacks', async () => {
    getTopic.mockResolvedValue(null);
    getResearch.mockResolvedValue(null);
    getDraft.mockResolvedValue(null);
    getPublications.mockResolvedValue([]);
    getWorkflowEvents.mockResolvedValue([]);
    getWorkflowRuns.mockResolvedValue([]);

    const { default: TopicHistoryPage } = await import('./page');
    const html = renderToStaticMarkup(await TopicHistoryPage({ params: Promise.resolve({ topicId: 'topic-1' }) }));

    expect(html).toContain('Topic');
    expect(html).toContain('No workflow events recorded yet.');
    expect(html).toContain('No workflow runs recorded yet.');
    expect(html).toContain('No publication records yet.');
  });
});
