import { getDraft, getDraftSection, getReviewSessions, getTopic } from '../../lib/api-client';
import type { DraftVersionView, TopicDetail } from '@aicp/contracts';

export type ReviewSessionView = Awaited<ReturnType<typeof getReviewSessions>>[number];
export type DraftSectionPayload = NonNullable<Awaited<ReturnType<typeof getDraftSection>>>;

export type TopicReviewData = {
  topic: TopicDetail | null;
  draft: DraftVersionView | null;
  reviewSessions: ReviewSessionView[];
  sectionPayload: DraftSectionPayload | null;
};

export async function loadReviewPageData(topicId: string, requestedSection?: string): Promise<TopicReviewData> {
  const [topic, draft, reviewSessions] = await Promise.all([getTopic(topicId), getDraft(topicId), getReviewSessions(topicId)]);
  const activeSectionKey = requestedSection ?? draft?.sections?.[0]?.sectionKey;
  const sectionPayload = activeSectionKey ? await getDraftSection(topicId, activeSectionKey) : null;

  return { topic, draft, reviewSessions, sectionPayload };
}
