import Link from 'next/link';
import { formatPercent } from '../../lib/formatting';
import { HomeMetricCard } from './home-metric-card';

function PipelineSnapshotCard({
  topicCount,
  scoredCount,
  approvedCount,
  blockedCount,
  averageConfidence,
}: {
  topicCount: number;
  scoredCount: number;
  approvedCount: number;
  blockedCount: number;
  averageConfidence: number;
}) {
  return (
    <div className="hero-card">
      <p className="eyebrow">Pipeline Snapshot</p>
      <div className="metric-stack">
        <HomeMetricCard label="Topics in API" value={topicCount} />
        <HomeMetricCard label="Scored and moving" value={scoredCount} />
        <HomeMetricCard label="Ready or approved" value={approvedCount} />
        <HomeMetricCard label="Blocked" value={blockedCount} />
      </div>
      <p className="topic-meta">
        Discovery confidence average: {formatPercent(averageConfidence)}. Dashboard cards now render the live topic source, score, tags,
        and rejection state from the API payload.
      </p>
    </div>
  );
}

export function HeroSection({
  topicCount,
  scoredCount,
  approvedCount,
  blockedCount,
  averageConfidence,
}: {
  topicCount: number;
  scoredCount: number;
  approvedCount: number;
  blockedCount: number;
  averageConfidence: number;
}) {
  return (
    <section className="hero">
      <div className="hero-card hero-copy">
        <p className="eyebrow">Full Flow</p>
        <h2>From manually-created topics to research, draft, revision, SEO, social, and publication.</h2>
        <p className="lede">
          The API owns orchestration. BullMQ workers execute structured generation. Humans stay in the loop for scoring, approval,
          review, revision, and publish decisions.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/topics">
            Open topics
          </Link>
          <Link className="button button-secondary" href="/analytics">
            View analytics
          </Link>
        </div>
      </div>
      <PipelineSnapshotCard
        topicCount={topicCount}
        scoredCount={scoredCount}
        approvedCount={approvedCount}
        blockedCount={blockedCount}
        averageConfidence={averageConfidence}
      />
    </section>
  );
}
