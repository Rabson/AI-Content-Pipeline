import type {
  DraftGenerateSectionJobPayload,
  PublishArticleJobPayload,
  RevisionApplySectionJobPayload,
} from '@aicp/queue-contracts';

export const ANALYTICS_JOB_RUNNER = Symbol('ANALYTICS_JOB_RUNNER');
export const DISCOVERY_JOB_RUNNER = Symbol('DISCOVERY_JOB_RUNNER');
export const DRAFT_JOB_RUNNER = Symbol('DRAFT_JOB_RUNNER');
export const OUTLINE_JOB_RUNNER = Symbol('OUTLINE_JOB_RUNNER');
export const PUBLISH_JOB_RUNNER = Symbol('PUBLISH_JOB_RUNNER');
export const RESEARCH_JOB_RUNNER = Symbol('RESEARCH_JOB_RUNNER');
export const REVISION_JOB_RUNNER = Symbol('REVISION_JOB_RUNNER');
export const SEO_JOB_RUNNER = Symbol('SEO_JOB_RUNNER');
export const SOCIAL_JOB_RUNNER = Symbol('SOCIAL_JOB_RUNNER');

export interface AnalyticsJobRunner {
  runDailyRollup(usageDate: string): Promise<unknown>;
}

export interface DiscoveryJobRunner {
  runImport(payload: unknown): Promise<unknown>;
}

export interface DraftJobRunner {
  processSection(payload: DraftGenerateSectionJobPayload): Promise<unknown>;
  finalizeDraft(draftVersionId: string): Promise<unknown>;
}

export interface OutlineJobRunner {
  run(topicId: string): Promise<unknown>;
}

export interface PublishJobRunner {
  publish(payload: PublishArticleJobPayload): Promise<unknown>;
}

export interface ResearchJobRunner {
  run(topicId: string, traceId?: string): Promise<unknown>;
}

export interface RevisionJobRunner {
  processRevisionSection(payload: RevisionApplySectionJobPayload): Promise<unknown>;
  finalizeRevision(revisionRunId: string): Promise<unknown>;
}

export interface SeoJobRunner {
  run(topicId: string): Promise<unknown>;
}

export interface SocialJobRunner {
  runLinkedIn(topicId: string): Promise<unknown>;
}
