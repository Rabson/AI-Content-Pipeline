import { AnalyticsSummaryGrid } from '../../components/analytics/analytics-summary-grid';
import { LifecycleOverviewPanel } from '../../components/analytics/lifecycle-overview-panel';
import { loadAnalyticsData } from '../../components/analytics/analytics-data';
import { UsagePanel } from '../../components/analytics/usage-panel';
import { isPhaseEnabled } from '../../lib/feature-flags';

export const dynamic = 'force-dynamic';

function AnalyticsDisabledState() {
  return (
    <main className="page stack">
      <section className="panel">
        <p className="empty-state">Phase 3 analytics is disabled in this environment.</p>
      </section>
    </main>
  );
}

export default async function AnalyticsPage() {
  if (!isPhaseEnabled(3)) {
    return <AnalyticsDisabledState />;
  }

  const { usage, overview, topics } = await loadAnalyticsData();

  return (
    <main className="page stack">
      <section className="detail-header">
        <p className="eyebrow">Analytics</p>
        <h2>Operational and LLM metrics</h2>
        <p className="lede">Daily rollups now track throughput, revision rate, approval latency, publish cadence, and token spend.</p>
      </section>
      <AnalyticsSummaryGrid topics={topics} />
      <section className="grid-two">
        <LifecycleOverviewPanel overview={overview} topics={topics} />
        <UsagePanel usage={usage} />
      </section>
    </main>
  );
}
