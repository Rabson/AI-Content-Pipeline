import Link from 'next/link';
import type { DraftVersionView, TopicDetail } from '@aicp/shared-types';
import { approveDraftAction, createReviewSessionAction } from '../actions';
import { getDraft, getReviewSessions, getTopic } from '../../../../lib/api-client';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';

export const dynamic = 'force-dynamic';

type ReviewSessionView = Awaited<ReturnType<typeof getReviewSessions>>[number];

type TopicDraftData = {
  topic: TopicDetail | null;
  draft: DraftVersionView | null;
  reviewSessions: ReviewSessionView[];
};

async function loadDraftPageData(topicId: string): Promise<TopicDraftData> {
  const [topic, draft, reviewSessions] = await Promise.all([getTopic(topicId), getDraft(topicId), getReviewSessions(topicId)]);
  return { topic, draft, reviewSessions };
}

function DraftHeaderActions({
  topicId,
  draft,
  openReviewSession,
}: {
  topicId: string;
  draft: DraftVersionView | null;
  openReviewSession: ReviewSessionView | undefined;
}) {
  if (!draft) {
    return null;
  }

  return (
    <>
      {!openReviewSession ? (
        <form action={createReviewSessionAction.bind(null, topicId, draft.id)}>
          <button className="button button-secondary" type="submit">
            Start review session
          </button>
        </form>
      ) : null}
      <form action={approveDraftAction.bind(null, topicId, draft.id)}>
        <button className="button" type="submit">
          Approve latest draft
        </button>
      </form>
    </>
  );
}

function DraftSectionsPanel({ topicId, draft }: { topicId: string; draft: DraftVersionView | null }) {
  return (
    <div className="panel">
      <h3>Sections</h3>
      <div className="list">
        {draft?.sections?.map((section) => (
          <Link className="list-item" key={section.sectionKey} href={`/topics/${topicId}/review?section=${section.sectionKey}`}>
            <div>
              <strong>
                {section.position}. {section.heading}
              </strong>
              <p>{section.wordCount ?? 0} words</p>
            </div>
            <span className="pill">{section.sectionKey}</span>
          </Link>
        ))}
        {!draft?.sections?.length ? <p className="empty-state">No draft sections found.</p> : null}
      </div>
    </div>
  );
}

function DraftMarkdownPanel({ draft }: { draft: DraftVersionView | null }) {
  return (
    <div className="panel">
      <h3>Markdown</h3>
      <div className="code-block">{draft?.assembledMarkdown ?? 'Draft markdown not generated yet.'}</div>
    </div>
  );
}

export default async function TopicDraftPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const { topic, draft, reviewSessions } = await loadDraftPageData(topicId);
  const openReviewSession = reviewSessions.find((session) => session.status === 'OPEN');

  return (
    <main className="page stack">
      <TopicPageHeader
        eyebrow="Draft"
        title={topic?.title ?? 'Topic'}
        topicId={topicId}
        actions={<DraftHeaderActions topicId={topicId} draft={draft} openReviewSession={openReviewSession} />}
      />
      <section className="grid-two">
        <DraftSectionsPanel topicId={topicId} draft={draft} />
        <DraftMarkdownPanel draft={draft} />
      </section>
    </main>
  );
}
