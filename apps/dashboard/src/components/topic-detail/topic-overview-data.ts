import {
  getDraft,
  getLinkedInDraft,
  getPublications,
  getResearch,
  getSeo,
  getTopic,
} from '../../lib/api-client';
import type {
  LinkedInDraftView,
  PublicationView,
  ResearchArtifactView,
  SeoMetadataView,
  TopicDetail,
} from '@aicp/shared-types';

export type TopicPageData = {
  topic: TopicDetail | null;
  research: ResearchArtifactView | null;
  draft: Awaited<ReturnType<typeof getDraft>>;
  seo: SeoMetadataView | null;
  social: LinkedInDraftView | null;
  publications: PublicationView[];
};

export async function loadTopicOverviewData(topicId: string, phase2Enabled: boolean): Promise<TopicPageData> {
  const [topic, research, draft, seo, social, publications] = await Promise.all([
    getTopic(topicId),
    getResearch(topicId),
    getDraft(topicId),
    phase2Enabled ? getSeo(topicId) : Promise.resolve(null),
    phase2Enabled ? getLinkedInDraft(topicId) : Promise.resolve(null),
    phase2Enabled ? getPublications(topicId) : Promise.resolve([]),
  ]);

  return { topic, research, draft, seo, social, publications };
}
