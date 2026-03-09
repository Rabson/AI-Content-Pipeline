import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

const getDashboardUser = vi.fn();
const getOpsRuntimeStatus = vi.fn();
const getQueueMetrics = vi.fn();
const getFailedJobs = vi.fn();
const getFailedPublications = vi.fn();
const getSecurityEvents = vi.fn();

vi.mock('../../lib/auth', () => ({ getDashboardUser }));
vi.mock('../../lib/api-client', () => ({
  getOpsRuntimeStatus,
  getQueueMetrics,
  getFailedJobs,
  getFailedPublications,
  getSecurityEvents,
}));
vi.mock('./components/runtime-panels', () => ({
  RuntimeCard: () => React.createElement('section', null, 'runtime-card'),
  WorkerCard: () => React.createElement('section', null, 'worker-card'),
}));
vi.mock('./components/queue-panels', () => ({
  QueueMetricsPanel: () => React.createElement('section', null, 'queue-metrics-panel'),
  FailedJobsPanel: () => React.createElement('section', null, 'failed-jobs-panel'),
}));
vi.mock('./components/publication-security-panels', () => ({
  FailedPublicationsPanel: () => React.createElement('section', null, 'failed-publications-panel'),
  SecurityEventsPanel: () => React.createElement('section', null, 'security-events-panel'),
}));

describe('OpsPage', () => {
  beforeEach(() => {
    getDashboardUser.mockResolvedValue({ authorized: true, role: 'ADMIN' });
    getOpsRuntimeStatus.mockResolvedValue({ api: { health: null, readiness: null }, worker: null });
    getQueueMetrics.mockResolvedValue({ queues: {}, executionsLast24Hours: {} });
    getFailedJobs.mockResolvedValue([]);
    getFailedPublications.mockResolvedValue([]);
    getSecurityEvents.mockResolvedValue([]);
  });

  it('blocks non-admin users', async () => {
    getDashboardUser.mockResolvedValue({ authorized: true, role: 'EDITOR' });
    const { default: OpsPage } = await import('./page');
    const html = renderToStaticMarkup(await OpsPage());
    expect(html).toContain('Ops is restricted to admin users.');
  });

  it('renders ops panels for admin users', async () => {
    const { default: OpsPage } = await import('./page');
    const html = renderToStaticMarkup(await OpsPage());
    expect(html).toContain('runtime-card');
    expect(html).toContain('queue-metrics-panel');
    expect(html).toContain('failed-publications-panel');
  });
});
