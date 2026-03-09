import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

let phaseEnabled = true;

vi.mock('../../lib/feature-flags', () => ({ isPhaseEnabled: () => phaseEnabled }));
vi.mock('../../components/analytics/analytics-data', () => ({
  loadAnalyticsData: vi.fn().mockResolvedValue({ usage: {}, overview: {}, topics: [] }),
}));
vi.mock('../../components/analytics/analytics-summary-grid', () => ({
  AnalyticsSummaryGrid: () => React.createElement('section', null, 'analytics-summary-grid'),
}));
vi.mock('../../components/analytics/lifecycle-overview-panel', () => ({
  LifecycleOverviewPanel: () => React.createElement('section', null, 'lifecycle-overview-panel'),
}));
vi.mock('../../components/analytics/usage-panel', () => ({
  UsagePanel: () => React.createElement('section', null, 'usage-panel'),
}));

describe('AnalyticsPage', () => {
  beforeEach(() => {
    phaseEnabled = true;
  });

  it('shows disabled message when analytics phase is off', async () => {
    phaseEnabled = false;
    const { default: AnalyticsPage } = await import('./page');
    const html = renderToStaticMarkup(await AnalyticsPage());

    expect(html).toContain('Phase 3 analytics is disabled');
  });

  it('renders analytics panels when phase is on', async () => {
    const { default: AnalyticsPage } = await import('./page');
    const html = renderToStaticMarkup(await AnalyticsPage());

    expect(html).toContain('analytics-summary-grid');
    expect(html).toContain('lifecycle-overview-panel');
    expect(html).toContain('usage-panel');
  });
});
