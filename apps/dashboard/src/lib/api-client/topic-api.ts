import type {
  DraftVersionView,
  LinkedInDraftView,
  OutlineSectionView,
  PublicationOptionsView,
  PublicationView,
  ResearchArtifactView,
  ReviewCommentView,
  SeoMetadataView,
  StorageObjectView,
  TopicDetail,
  TopicSummary,
} from '@aicp/shared-types';
import { normalizeTopic, safeFetch } from './core';

export function getTopics() {
  return safeFetch<TopicSummary[]>('/v1/topics', undefined, []).then((topics) => topics.map(normalizeTopic));
}

export function getTopic(topicId: string) {
  return safeFetch<TopicDetail | null>(`/v1/topics/${topicId}`, undefined, null).then((topic) =>
    topic ? (normalizeTopic(topic) as TopicDetail) : null,
  );
}

export function getResearch(topicId: string) {
  return safeFetch<ResearchArtifactView | null>(`/v1/topics/${topicId}/research`, undefined, null);
}

export function getOutline(topicId: string) {
  return safeFetch<
    | {
        title?: string;
        objective?: string;
        sections?: OutlineSectionView[];
      }
    | null
  >(`/v1/topics/${topicId}/outline`, undefined, null);
}

export function getDraft(topicId: string) {
  return safeFetch<DraftVersionView | null>(`/v1/topics/${topicId}/drafts/current`, undefined, null);
}

export function getDraftSection(topicId: string, sectionKey: string) {
  return safeFetch<
    | {
        draftVersionId: string;
        versionNumber: number;
        section: DraftVersionView['sections'][number];
        comments: ReviewCommentView[];
      }
    | null
  >(`/v1/topics/${topicId}/draft/sections/${sectionKey}`, undefined, null);
}

export function getSeo(topicId: string): Promise<SeoMetadataView | null> {
  return safeFetch<SeoMetadataView | null>(`/v1/topics/${topicId}/seo`, undefined, null);
}

export function getLinkedInDraft(topicId: string): Promise<LinkedInDraftView | null> {
  return safeFetch<LinkedInDraftView | null>(`/v1/topics/${topicId}/social/linkedin`, undefined, null);
}

export function getPublications(topicId: string) {
  return safeFetch<PublicationView[]>(`/v1/topics/${topicId}/publications`, undefined, []);
}

export function getPublicationOptions(topicId: string) {
  return safeFetch<PublicationOptionsView | null>(
    `/v1/topics/${topicId}/publications/options`,
    undefined,
    null,
  );
}

export function getTopicAssets(topicId: string) {
  return safeFetch<StorageObjectView[]>(`/v1/topics/${topicId}/assets`, undefined, []);
}
