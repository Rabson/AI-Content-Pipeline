import type { RevisionDiffView, TopicDetail } from '@aicp/contracts';
import { getRevisionDiff, getRevisionRuns, getTopic } from '../../../../lib/api-client';
import { formatDate } from '../../../../lib/formatting';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';

export const dynamic = 'force-dynamic';

type RevisionRunView = Awaited<ReturnType<typeof getRevisionRuns>>[number];

type TopicRevisionData = {
  topic: TopicDetail | null;
  revisionRuns: RevisionRunView[];
  latestDiff: { sectionDiffs: RevisionDiffView[] };
};

async function loadRevisionPageData(topicId: string): Promise<TopicRevisionData> {
  const [topic, revisionRuns] = await Promise.all([getTopic(topicId), getRevisionRuns(topicId)]);
  const latestRun = revisionRuns[0];
  const latestDiff = latestRun?.fromDraftVersionId && latestRun?.toDraftVersionId
    ? await getRevisionDiff(topicId, latestRun.fromDraftVersion.versionNumber, latestRun.toDraftVersion.versionNumber)
    : { sectionDiffs: [] };

  return { topic, revisionRuns, latestDiff };
}

function RevisionRunsPanel({ revisionRuns }: { revisionRuns: RevisionRunView[] }) {
  return (
    <div className="panel">
      <h3>Revision runs</h3>
      <div className="list">
        {revisionRuns.map((run) => (
          <div key={run.id} className="list-item">
            <div>
              <strong>{run.status}</strong>
              <p>{run.items?.length ?? 0} section items</p>
              <p className="topic-meta">Created {formatDate(run.createdAt)}</p>
            </div>
            <span className="pill">{run.sectionDiffs?.length ?? 0} diffs</span>
          </div>
        ))}
        {!revisionRuns.length ? <p className="empty-state">No revision runs recorded yet.</p> : null}
      </div>
    </div>
  );
}

function RevisionDiffPanel({ latestDiff }: { latestDiff: { sectionDiffs: RevisionDiffView[] } }) {
  return (
    <div className="panel">
      <h3>Latest diff view</h3>
      <div className="list">
        {latestDiff.sectionDiffs.map((diff) => (
          <div key={diff.sectionKey} className="stack">
            <strong>{diff.sectionKey}</strong>
            <div className="code-block">{diff.diffUnifiedMd}</div>
          </div>
        ))}
        {!latestDiff.sectionDiffs.length ? <p className="empty-state">Run a section revision to populate diffs.</p> : null}
      </div>
    </div>
  );
}

export default async function TopicRevisionsPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const { topic, revisionRuns, latestDiff } = await loadRevisionPageData(topicId);

  return (
    <main className="page stack">
      <TopicPageHeader eyebrow="Revisions" title={topic?.title ?? 'Topic'} topicId={topicId} />
      <section className="grid-two">
        <RevisionRunsPanel revisionRuns={revisionRuns} />
        <RevisionDiffPanel latestDiff={latestDiff} />
      </section>
    </main>
  );
}
