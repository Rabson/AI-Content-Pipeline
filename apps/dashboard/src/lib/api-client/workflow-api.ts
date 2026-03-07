import type { DiscoverySuggestionView, RevisionDiffView } from '@aicp/shared-types';
import { safeFetch } from './core';

export function getReviewSessions(topicId: string) {
  return safeFetch<any[]>(`/v1/topics/${topicId}/reviews`, undefined, []);
}

export function getRevisionRuns(topicId: string) {
  return safeFetch<any[]>(`/v1/topics/${topicId}/revisions`, undefined, []);
}

export function getRevisionDiff(topicId: string, fromVersion?: number, toVersion?: number) {
  const query = fromVersion && toVersion ? `?fromVersion=${fromVersion}&toVersion=${toVersion}` : '';
  return safeFetch<{ sectionDiffs: RevisionDiffView[] }>(
    `/v1/topics/${topicId}/drafts/compare${query}`,
    undefined,
    { sectionDiffs: [] },
  );
}

export function getWorkflowEvents(topicId: string) {
  return safeFetch<any[]>(`/v1/topics/${topicId}/workflow/events`, undefined, []);
}

export function getWorkflowRuns(topicId: string) {
  return safeFetch<any[]>(`/v1/topics/${topicId}/workflow/runs`, undefined, []);
}

export function getDiscoverySuggestions() {
  return safeFetch<{ suggestions: DiscoverySuggestionView[] }>(
    '/v1/discovery/suggestions',
    undefined,
    { suggestions: [] },
  );
}
