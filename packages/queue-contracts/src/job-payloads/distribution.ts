export type PublicationChannel = 'DEVTO' | 'MEDIUM' | 'LINKEDIN';

export interface SocialLinkedInGenerateJobPayload {
  topicId: string;
  requestedBy?: string;
  traceId?: string;
}

export interface PublishArticleJobPayload {
  publicationId: string;
  topicId: string;
  channel: PublicationChannel;
  canonicalUrl?: string;
  tags: string[];
  requestedBy?: string;
}

export interface AnalyticsRollupDailyJobPayload {
  usageDate: string;
  requestedBy?: string;
}

export interface DiscoveryImportJobPayload {
  provider: string;
  query?: string;
  limit: number;
  audience?: string;
  tags?: string[];
  autoScore: boolean;
  minimumScore: number;
  actorId: string;
}
