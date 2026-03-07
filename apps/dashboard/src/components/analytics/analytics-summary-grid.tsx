import type { TopicSummary } from '@aicp/shared-types';
import { formatScore } from '../../lib/formatting';
import { calculateAverageScore } from './analytics-data';
import { AnalyticsMetricCard } from './analytics-metric-card';

export function AnalyticsSummaryGrid({ topics }: { topics: TopicSummary[] }) {
  const approvedTopics = topics.filter((topic) => topic.status === 'APPROVED' || topic.status === 'RESEARCH_READY');
  const blockedTopics = topics.filter((topic) => topic.status === 'REJECTED' || topic.status === 'FAILED');

  return (
    <section className="grid-four">
      <AnalyticsMetricCard label="Topics tracked" value={topics.length} description="Live count from Topic Service." />
      <AnalyticsMetricCard
        label="Approved or ready"
        value={approvedTopics.length}
        description="Topics that have cleared scoring or research readiness."
      />
      <AnalyticsMetricCard
        label="Blocked topics"
        value={blockedTopics.length}
        description="Rejected or failed items that need a human decision."
      />
      <AnalyticsMetricCard
        label="Average score"
        value={formatScore(calculateAverageScore(topics)).replace('Score ', '')}
        description="Average of scored topics currently returned by the API."
      />
    </section>
  );
}
