export type QueueName = 'content.pipeline' | 'publishing' | 'social' | 'analytics';

export type ContentPipelineJobName =
  | 'research.run'
  | 'outline.generate'
  | 'draft.generate.start'
  | 'draft.generate.section'
  | 'draft.generate.finalize'
  | 'revision.apply.start'
  | 'revision.apply.section'
  | 'revision.apply.finalize'
  | 'seo.generate'
  | 'social.linkedin.generate'
  | 'publish.article'
  | 'analytics.rollup.daily';

export interface ResearchRunJobPayload {
  topicId: string;
  contentItemId?: string;
  requestedBy?: string;
  traceId?: string;
}

export interface OutlineGenerateJobPayload {
  topicId: string;
  contentItemId?: string;
  requestedBy?: string;
  traceId?: string;
}
