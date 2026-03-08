import type { AnalyticsOverviewView, TopicSummary } from '@aicp/contracts';
import { formatStatus } from '../../lib/formatting';

function LifecycleOverviewRow({ item }: { item: AnalyticsOverviewView }) {
  return (
    <div className="list-item">
      <div>
        <strong>{item.usageDate.slice(0, 10)}</strong>
        <p>Throughput: {item.throughputCount} · Published: {item.publishCount}</p>
        <p>Lead time: {Number(item.avgLeadTimeHours).toFixed(1)}h · Approval latency: {Number(item.avgApprovalLatencyHours).toFixed(1)}h</p>
      </div>
      <span className="pill">Revision rate {Number(item.avgRevisionRate).toFixed(2)}</span>
    </div>
  );
}

function LifecycleSnapshotFallback({
  topics,
  approvedCount,
  blockedCount,
}: {
  topics: TopicSummary[];
  approvedCount: number;
  blockedCount: number;
}) {
  return (
    <div className="list-item">
      <div>
        <strong>Live pipeline snapshot</strong>
        <p>Approved {approvedCount} · Blocked {blockedCount} · Total topics {topics.length}</p>
        <p className="topic-meta">
          Rollups have not been generated yet. This snapshot is derived from current topic states instead of the analytics daily tables.
        </p>
      </div>
      <span className="pill">{formatStatus(topics[0]?.status ?? 'ACTIVE')}</span>
    </div>
  );
}

export function LifecycleOverviewPanel({
  overview,
  topics,
}: {
  overview: AnalyticsOverviewView[];
  topics: TopicSummary[];
}) {
  const approvedTopics = topics.filter((topic) => topic.status === 'APPROVED' || topic.status === 'RESEARCH_READY');
  const blockedTopics = topics.filter((topic) => topic.status === 'REJECTED' || topic.status === 'FAILED');

  return (
    <div className="panel">
      <h3>Lifecycle overview</h3>
      <div className="list">
        {overview.map((item) => (
          <LifecycleOverviewRow key={item.usageDate} item={item} />
        ))}
        {!overview.length ? (
          <LifecycleSnapshotFallback topics={topics} approvedCount={approvedTopics.length} blockedCount={blockedTopics.length} />
        ) : null}
      </div>
    </div>
  );
}
