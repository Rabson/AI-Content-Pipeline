import type { DraftVersionView, PublicationView, ResearchArtifactView, TopicDetail } from '@aicp/shared-types';
import {
  getDraft,
  getPublications,
  getResearch,
  getTopic,
  getWorkflowEvents,
  getWorkflowRuns,
} from '../../../../lib/api-client';
import { formatDate } from '../../../../lib/formatting';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';

type WorkflowEventView = Awaited<ReturnType<typeof getWorkflowEvents>>[number];
type WorkflowRunView = Awaited<ReturnType<typeof getWorkflowRuns>>[number];

type TopicHistoryData = {
  topic: TopicDetail | null;
  research: ResearchArtifactView | null;
  draft: DraftVersionView | null;
  publications: PublicationView[];
  events: WorkflowEventView[];
  runs: WorkflowRunView[];
};

export const dynamic = 'force-dynamic';

async function loadTopicHistoryData(topicId: string): Promise<TopicHistoryData> {
  const [topic, research, draft, publications, events, runs] = await Promise.all([
    getTopic(topicId),
    getResearch(topicId),
    getDraft(topicId),
    getPublications(topicId),
    getWorkflowEvents(topicId),
    getWorkflowRuns(topicId),
  ]);

  return { topic, research, draft, publications, events, runs };
}

function HistorySummaryGrid({
  topic,
  research,
  draft,
}: {
  topic: TopicDetail | null;
  research: ResearchArtifactView | null;
  draft: DraftVersionView | null;
}) {
  return (
    <section className="grid-three">
      <HistoryStatCard label="Topic" title={topic?.status ?? 'Missing'} detail={`Created ${formatDate(topic?.createdAt)}`} />
      <HistoryStatCard label="Research" title={research ? 'Captured' : 'Missing'} detail={research?.summary ?? 'No research snapshot.'} />
      <HistoryStatCard
        label="Draft"
        title={draft?.status ?? 'Missing'}
        detail={draft?.versionNumber ? `Version ${draft.versionNumber}` : 'No version yet.'}
      />
    </section>
  );
}

function HistoryStatCard({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <div className="stat-card">
      <p className="eyebrow">{label}</p>
      <h3>{title}</h3>
      <p className="topic-meta">{detail}</p>
    </div>
  );
}

function WorkflowEventsPanel({ events }: { events: WorkflowEventView[] }) {
  return (
    <div className="panel">
      <h3>Workflow events</h3>
      <div className="list">
        {events.map((event) => (
          <div className="list-item" key={event.id}>
            <div>
              <strong>{event.eventType}</strong>
              <p>{event.stage}</p>
              <p className="topic-meta">{formatDate(event.createdAt)}</p>
            </div>
            <span className="pill">{event.toState ?? event.fromState ?? 'n/a'}</span>
          </div>
        ))}
        {!events.length ? <p className="empty-state">No workflow events recorded yet.</p> : null}
      </div>
    </div>
  );
}

function WorkflowRunsPanel({ runs }: { runs: WorkflowRunView[] }) {
  return (
    <div className="panel">
      <h3>Workflow runs</h3>
      <div className="list">
        {runs.map((run) => (
          <div className="list-item" key={run.id}>
            <div>
              <strong>{run.stage}</strong>
              <p>{run.status}</p>
              <p className="topic-meta">Started {formatDate(run.startedAt)}</p>
            </div>
            <span className="pill">{run.events?.length ?? 0} events</span>
          </div>
        ))}
        {!runs.length ? <p className="empty-state">No workflow runs recorded yet.</p> : null}
      </div>
    </div>
  );
}

function PublicationLedgerPanel({ publications }: { publications: PublicationView[] }) {
  return (
    <section className="panel">
      <h3>Publication ledger</h3>
      <div className="list">
        {publications.map((publication) => (
          <div className="list-item" key={publication.id}>
            <div>
              <strong>{publication.channel}</strong>
              <p>{publication.externalUrl ?? publication.error ?? 'Pending'}</p>
            </div>
            <span className="pill">{publication.status}</span>
          </div>
        ))}
        {!publications.length ? <p className="empty-state">No publication records yet.</p> : null}
      </div>
    </section>
  );
}

export default async function TopicHistoryPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const { topic, research, draft, publications, events, runs } = await loadTopicHistoryData(topicId);

  return (
    <main className="page stack">
      <TopicPageHeader eyebrow="History" title={topic?.title ?? 'Topic'} topicId={topicId} />
      <HistorySummaryGrid topic={topic} research={research} draft={draft} />
      <section className="grid-two">
        <WorkflowEventsPanel events={events} />
        <WorkflowRunsPanel runs={runs} />
      </section>
      <PublicationLedgerPanel publications={publications} />
    </main>
  );
}
