import type { SourceType } from '@prisma/client';

export interface ManualSourceInput {
  url: string;
  domain?: string | null;
  title?: string;
  excerpt?: string;
  sourceType: SourceType;
}

export interface ResearchOutputSource {
  id: string;
  url: string;
  title: string;
  credibilityScore: number;
}

export interface ResearchOutputKeyPoint {
  point: string;
  importance: string;
  sourceIds: string[];
}

export interface ResearchOutputExample {
  title: string;
  description: string;
  takeaway: string;
  sourceIds: string[];
}

export interface ResearchUsagePayload {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PersistResearchResultParams {
  topicId: string;
  contentItemId?: string;
  versionNumber: number;
  model: string;
  promptHash: string;
  payload: Record<string, unknown>;
  output: {
    summary: string;
    confidenceScore: number;
    sources: ResearchOutputSource[];
    keyPoints: ResearchOutputKeyPoint[];
    examples: ResearchOutputExample[];
  };
  usage?: ResearchUsagePayload;
}
