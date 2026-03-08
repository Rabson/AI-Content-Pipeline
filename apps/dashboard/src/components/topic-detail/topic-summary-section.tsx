import type { TopicDetail } from '@aicp/contracts';
import { TopicPageHeader } from '../shared/topic-page-header';
import { formatDate, formatScore, formatStatus, formatTopicPreview, formatTopicSource } from '../../lib/formatting';

function TopicMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function TopicSummarySection({ topic, topicId }: { topic: TopicDetail; topicId: string }) {
  return (
    <>
      <TopicPageHeader
        eyebrow="Topic Overview"
        title={topic.title}
        topicId={topicId}
        lede={formatTopicPreview(topic.brief, 320)}
      />
      <section className="detail-meta-grid">
        <TopicMetaItem label="Lifecycle" value={formatStatus(topic.status)} />
        <TopicMetaItem label="Source" value={formatTopicSource(topic.source)} />
        <TopicMetaItem label="Score" value={formatScore(topic.scoreTotal)} />
        <TopicMetaItem label="Audience" value={topic.audience ?? 'Not set'} />
        <TopicMetaItem label="Created" value={formatDate(topic.createdAt)} />
        <TopicMetaItem label="Updated" value={formatDate(topic.updatedAt)} />
      </section>
      {topic.tags?.length ? (
        <div className="pill-row">
          {topic.tags.map((tag) => (
            <span className="pill pill-neutral" key={`${topic.id}-${tag.tag}`}>
              {tag.tag}
            </span>
          ))}
        </div>
      ) : null}
      {topic.rejectionReason ? <p className="inline-alert">Rejected: {topic.rejectionReason}</p> : null}
    </>
  );
}
