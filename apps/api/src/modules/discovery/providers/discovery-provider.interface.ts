export interface DiscoveryImportParams {
  query?: string;
  limit: number;
  audience?: string;
  tags?: string[];
}

export interface DiscoveryCandidate {
  title: string;
  brief?: string;
  audience?: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  externalId?: string;
  publishedAt?: string;
  engagementScore?: number;
  discussionScore?: number;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryProvider {
  readonly providerName: string;
  fetchCandidates(params: DiscoveryImportParams): Promise<DiscoveryCandidate[]>;
}
