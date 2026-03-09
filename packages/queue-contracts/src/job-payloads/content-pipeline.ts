import type { QueueContractEnvelope } from '../contract-version';

export interface ResearchRunJobPayload extends QueueContractEnvelope {
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

export interface OutlineGenerateJobPayload extends QueueContractEnvelope {
  topicId: string;
  contentItemId?: string;
  requestedBy?: string;
  traceId?: string;
}

export interface DraftGenerateStartJobPayload extends QueueContractEnvelope {
  topicId: string;
  draftVersionId: string;
  styleProfile?: string;
}

export interface DraftGenerateSectionJobPayload extends QueueContractEnvelope {
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

export interface DraftGenerateFinalizeJobPayload extends QueueContractEnvelope {
  topicId: string;
  draftVersionId: string;
}

export interface RevisionApplyStartJobPayload extends QueueContractEnvelope {
  topicId: string;
  revisionRunId: string;
  fromDraftVersionId: string;
  toDraftVersionId: string;
}

export interface RevisionApplySectionJobPayload extends QueueContractEnvelope {
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

export interface RevisionApplyFinalizeJobPayload extends QueueContractEnvelope {
  revisionRunId: string;
}

export interface SeoGenerateJobPayload extends QueueContractEnvelope {
  topicId: string;
  requestedBy?: string;
  traceId?: string;
}
