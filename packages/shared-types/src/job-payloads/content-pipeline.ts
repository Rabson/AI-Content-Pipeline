export interface ResearchRunJobPayload {
  topicId: string;
  contentItemId?: string;
  requestedBy?: string;
  enqueuedBy?: string;
  traceId?: string;
  title?: string;
  brief?: string | null;
  audience?: string | null;
  sourceUrls?: string[];
}

export interface OutlineGenerateJobPayload {
  topicId: string;
  contentItemId?: string;
  requestedBy?: string;
  traceId?: string;
}

export interface DraftGenerateStartJobPayload {
  topicId: string;
  draftVersionId: string;
  styleProfile?: string;
}

export interface DraftGenerateSectionJobPayload {
  topicId: string;
  draftVersionId: string;
  sectionKey: string;
  heading: string;
  position: number;
  objective: string;
  previousHeading?: string;
  nextHeading?: string;
  researchSummary: string;
  keyPoints: string[];
  styleProfile?: string;
  targetWords?: number;
}

export interface DraftGenerateFinalizeJobPayload {
  topicId: string;
  draftVersionId: string;
}

export interface RevisionApplyStartJobPayload {
  topicId: string;
  revisionRunId: string;
  fromDraftVersionId: string;
  toDraftVersionId: string;
}

export interface RevisionApplySectionJobPayload {
  topicId: string;
  topicTitle: string;
  revisionRunId: string;
  revisionItemId: string;
  toDraftVersionId: string;
  sectionKey: string;
  heading: string;
  currentSectionMarkdown: string;
  instructionMd: string;
  commentTexts: string[];
}

export interface RevisionApplyFinalizeJobPayload {
  revisionRunId: string;
}

export interface SeoGenerateJobPayload {
  topicId: string;
  requestedBy?: string;
  traceId?: string;
}
