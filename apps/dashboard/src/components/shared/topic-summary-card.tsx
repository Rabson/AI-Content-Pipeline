import type { TopicSummary } from '@aicp/shared-types';
import Link from 'next/link';
import {
  formatDate,
  formatScore,
  formatStatus,
  formatTopicPreview,
  formatTopicSource,
  sourceTone,
  topicStatusTone,
} from '../../lib/formatting';

export function TopicSummaryCard({ topic }: { topic: TopicSummary }) {
  const tags = topic.tags?.slice(0, 4) ?? [];

  return (
    <Link href={`/topics/${topic.id}`} className="list-item topic-card">
      <div className="topic-card-main">
        <div className="topic-card-header">
          <div>
            <p className="topic-kicker">Topic Intake</p>
            <strong className="topic-card-title">{topic.title}</strong>
          </div>
          <div className="pill-row">
            <span className={`pill pill-${topicStatusTone(topic.status)}`}>{formatStatus(topic.status)}</span>
            <span className={`pill pill-${sourceTone(topic.source)}`}>{formatTopicSource(topic.source)}</span>
            <span className="pill pill-neutral">{formatScore(topic.scoreTotal)}</span>
          </div>
        </div>

        <p>{formatTopicPreview(topic.brief, 220)}</p>

        <div className="inline-meta">
          <span>Created {formatDate(topic.createdAt)}</span>
          {topic.audience ? <span>Audience {topic.audience}</span> : null}
        </div>

        {tags.length ? (
          <div className="pill-row">
            {tags.map((tag) => (
              <span className="pill pill-neutral" key={`${topic.id}-${tag.tag}`}>
                {tag.tag}
              </span>
            ))}
          </div>
        ) : null}

        {topic.rejectionReason ? <p className="inline-alert">Rejected: {topic.rejectionReason}</p> : null}
      </div>
    </Link>
  );
}
