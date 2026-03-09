import type { QueueContractEnvelope } from '../contract-version';

export type PublicationChannel = 'DEVTO' | 'MEDIUM' | 'LINKEDIN';

export interface SocialLinkedInGenerateJobPayload extends QueueContractEnvelope {
  topicId: string;
  requestedBy?: string;
  traceId?: string;
}

export interface PublishArticleJobPayload extends QueueContractEnvelope {
  publicationId: string;
  topicId: string;
  channel: PublicationChannel;
  canonicalUrl?: string;
  tags: string[];
  requestedBy?: string;
}

export interface AnalyticsRollupDailyJobPayload extends QueueContractEnvelope {
  usageDate: string;
  requestedBy?: string;
}

export interface DiscoveryImportJobPayload extends QueueContractEnvelope {
  provider: string;
  query?: string;
  limit: number;
  audience?: string;
  tags?: string[];
  autoScore: boolean;
  minimumScore: number;
  actorId: string;
}
