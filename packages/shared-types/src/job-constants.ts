export const CONTENT_PIPELINE_QUEUE = 'content.pipeline' as const;
export const PUBLISHING_QUEUE = 'publishing' as const;
export const SOCIAL_QUEUE = 'social' as const;
export const ANALYTICS_QUEUE = 'analytics' as const;

export const RESEARCH_RUN_JOB = 'research.run' as const;
export const OUTLINE_GENERATE_JOB = 'outline.generate' as const;
export const DRAFT_GENERATE_START_JOB = 'draft.generate.start' as const;
export const DRAFT_GENERATE_SECTION_JOB = 'draft.generate.section' as const;
export const DRAFT_GENERATE_FINALIZE_JOB = 'draft.generate.finalize' as const;
export const REVISION_APPLY_START_JOB = 'revision.apply.start' as const;
export const REVISION_APPLY_SECTION_JOB = 'revision.apply.section' as const;
export const REVISION_APPLY_FINALIZE_JOB = 'revision.apply.finalize' as const;
export const SEO_GENERATE_JOB = 'seo.generate' as const;
export const SOCIAL_LINKEDIN_GENERATE_JOB = 'social.linkedin.generate' as const;
export const PUBLISH_ARTICLE_JOB = 'publish.article' as const;
export const ANALYTICS_ROLLUP_DAILY_JOB = 'analytics.rollup.daily' as const;
export const DISCOVERY_IMPORT_JOB = 'discovery.import' as const;

export type QueueName =
  | typeof CONTENT_PIPELINE_QUEUE
  | typeof PUBLISHING_QUEUE
  | typeof SOCIAL_QUEUE
  | typeof ANALYTICS_QUEUE;

export type JobName =
  | typeof RESEARCH_RUN_JOB
  | typeof OUTLINE_GENERATE_JOB
  | typeof DRAFT_GENERATE_START_JOB
  | typeof DRAFT_GENERATE_SECTION_JOB
  | typeof DRAFT_GENERATE_FINALIZE_JOB
  | typeof REVISION_APPLY_START_JOB
  | typeof REVISION_APPLY_SECTION_JOB
  | typeof REVISION_APPLY_FINALIZE_JOB
  | typeof SEO_GENERATE_JOB
  | typeof SOCIAL_LINKEDIN_GENERATE_JOB
  | typeof PUBLISH_ARTICLE_JOB
  | typeof ANALYTICS_ROLLUP_DAILY_JOB
  | typeof DISCOVERY_IMPORT_JOB;
