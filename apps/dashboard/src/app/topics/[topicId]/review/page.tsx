import { ReviewHeaderActions } from '../../../../components/review/review-header-actions';
import { loadReviewPageData } from '../../../../components/review/review-page-data';
import { SectionListPanel } from '../../../../components/review/section-list-panel';
import { SectionReviewPanel } from '../../../../components/review/section-review-panel';
import { TopicPageHeader } from '../../../../components/shared/topic-page-header';

export const dynamic = 'force-dynamic';

export default async function TopicReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { topicId } = await params;
  const { section: requestedSection } = await searchParams;
  const { topic, draft, reviewSessions, sectionPayload } = await loadReviewPageData(topicId, requestedSection);
  const openSession = reviewSessions.find((session) => session.status === 'OPEN') ?? null;

  return (
    <main className="page stack">
      <TopicPageHeader
        eyebrow="Review"
        title={topic?.title ?? 'Topic'}
        topicId={topicId}
        actions={<ReviewHeaderActions topicId={topicId} draft={draft} openSession={openSession} />}
      />
      <section className="grid-two">
        <SectionListPanel topicId={topicId} draft={draft} />
        <SectionReviewPanel topicId={topicId} sectionPayload={sectionPayload} openSession={openSession} />
      </section>
    </main>
  );
}
