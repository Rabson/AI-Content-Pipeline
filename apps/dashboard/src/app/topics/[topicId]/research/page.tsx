import type { ResearchArtifactView } from '@aicp/shared-types';
import { getResearch, getTopic } from '../../../../lib/api-client';
import { cleanText, formatPercent, formatTopicPreview } from '../../../../lib/formatting';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';

export const dynamic = 'force-dynamic';

async function loadResearchPageData(topicId: string) {
  const [topic, research] = await Promise.all([getTopic(topicId), getResearch(topicId)]);
  return { topic, research };
}

function ResearchSummaryPanel({ research }: { research: ResearchArtifactView | null }) {
  return (
    <div className="panel">
      <h3>Summary</h3>
      {research ? (
        <div className="stack">
          <p>{cleanText(research.summary)}</p>
          <div className="pill-row">
            <span className="pill pill-success">{research.sources?.length ?? 0} sources</span>
            <span className="pill pill-neutral">{research.keyPoints?.length ?? 0} key points</span>
            <span className="pill pill-accent">{research.examples?.length ?? 0} examples</span>
            <span className="pill pill-warning">Confidence {formatPercent(research.confidenceScore ?? 0)}</span>
          </div>
        </div>
      ) : (
        <p className="empty-state">No research artifact yet.</p>
      )}
    </div>
  );
}

function SourcesPanel({ research }: { research: ResearchArtifactView | null }) {
  return (
    <div className="panel">
      <h3>Sources</h3>
      <div className="list">
        {research?.sources?.map((source) => (
          <a key={source.url} className="list-item" href={source.url} target="_blank" rel="noreferrer">
            <div>
              <strong>{source.title ?? source.url}</strong>
              <p>{source.url}</p>
            </div>
          </a>
        ))}
        {!research?.sources?.length ? <p className="empty-state">No sources stored.</p> : null}
      </div>
    </div>
  );
}

function KeyPointsPanel({ research }: { research: ResearchArtifactView | null }) {
  return (
    <div className="panel">
      <h3>Key points</h3>
      <div className="list">
        {research?.keyPoints?.map((point, index) => (
          <div key={`${point.point}-${index}`} className="list-item">
            <div>
              <strong>{cleanText(point.point)}</strong>
              <p className="topic-meta">{point.importance}</p>
            </div>
          </div>
        ))}
        {!research?.keyPoints?.length ? <p className="empty-state">No key points stored.</p> : null}
      </div>
    </div>
  );
}

function ExamplesPanel({ research }: { research: ResearchArtifactView | null }) {
  return (
    <div className="panel">
      <h3>Examples</h3>
      <div className="list">
        {research?.examples?.map((example, index) => (
          <div key={`${example.exampleTitle}-${index}`} className="list-item">
            <div>
              <strong>{example.exampleTitle ?? `Example ${index + 1}`}</strong>
              <p>{cleanText(example.exampleBody)}</p>
              {example.takeaway ? <p className="topic-meta">Takeaway: {cleanText(example.takeaway)}</p> : null}
            </div>
          </div>
        ))}
        {!research?.examples?.length ? <p className="empty-state">No examples stored.</p> : null}
      </div>
    </div>
  );
}

export default async function TopicResearchPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const { topic, research } = await loadResearchPageData(topicId);

  return (
    <main className="page stack">
      <TopicPageHeader
        eyebrow="Research"
        title={topic?.title ?? 'Topic'}
        topicId={topicId}
        lede={formatTopicPreview(topic?.brief, 280)}
      />
      <section className="grid-two">
        <ResearchSummaryPanel research={research} />
        <SourcesPanel research={research} />
      </section>
      <section className="grid-two">
        <KeyPointsPanel research={research} />
        <ExamplesPanel research={research} />
      </section>
    </main>
  );
}
