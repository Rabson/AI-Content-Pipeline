export type TopicStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCORED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESEARCH_QUEUED'
  | 'RESEARCH_IN_PROGRESS'
  | 'RESEARCH_READY'
  | 'FAILED'
  | 'ARCHIVED';

export type SocialPostStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'FAILED';

export interface TopicSummary {
  id: string;
  title: string;
  slug?: string;
  brief?: string | null;
  audience?: string | null;
  source?: string | null;
  status: TopicStatus;
  scoreTotal?: number | null;
  scoreBreakdown?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  approvalNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  contentItemId?: string | null;
  tags?: Array<{ tag: string }>;
}

export interface TopicDetail extends TopicSummary {
  slug: string;
  tags: Array<{ tag: string }>;
}

export interface ResearchArtifactView {
  summary: string;
  confidenceScore?: number | null;
  sources?: Array<{ id?: string; url: string; title?: string | null }>;
  keyPoints?: Array<{ point: string; importance: string }>;
  examples?: Array<{ exampleTitle?: string; exampleBody?: string; takeaway?: string | null }>;
}

export interface OutlineSectionView {
  sectionKey: string;
  heading: string;
  objective: string;
  targetWords: number;
  position: number;
}

export interface DraftSectionView {
  sectionKey: string;
  heading: string;
  position: number;
  contentMd?: string;
  wordCount?: number;
}

export interface DraftVersionView {
  id: string;
  versionNumber: number;
  status: string;
  assembledMarkdown?: string | null;
  sections: DraftSectionView[];
}

export interface ReviewCommentView {
  id: string;
  sectionKey: string;
  commentMd: string;
  severity: string;
  status: string;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface RevisionDiffView {
  sectionKey: string;
  beforeMd: string;
  afterMd: string;
  diffUnifiedMd: string;
}

export interface SeoMetadataView {
  id?: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string | null;
  tags: string[];
  keywords: string[];
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
}

export interface LinkedInDraftView {
  id: string;
  platform: 'LINKEDIN';
  status: SocialPostStatus;
  headline: string;
  post: string;
  hashtags: string[];
  callToAction: string;
  latestVersionNumber: number;
  approvedVersionNumber?: number | null;
  postedVersionNumber?: number | null;
  externalUrl?: string | null;
}

export interface PublicationView {
  id: string;
  channel: 'DEVTO';
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  title: string;
  externalUrl?: string | null;
  error?: string | null;
  createdAt: string;
  lockedForPublish?: boolean;
  verificationStatus?: string | null;
}

export interface AnalyticsUsageView {
  usageDate: string;
  module: string;
  model: string;
  totalTokens: number;
  estimatedCostUsd: number | string;
}

export interface AnalyticsOverviewView {
  usageDate: string;
  throughputCount: number;
  revisionCount: number;
  publishCount: number;
  publishCadenceCount: number;
  avgLeadTimeHours: number | string;
  avgRevisionRate: number | string;
  avgApprovalLatencyHours: number | string;
}

export interface ContentMetricsView {
  contentItemId: string;
  topicId?: string | null;
  topicTitle?: string | null;
  currentState: string;
  revisionCount: number;
  publicationCount: number;
  publishedAt?: string | null;
  leadTimeHours?: number | null;
  approvalLatencyHours?: number | null;
  llmTokens: number;
  llmCostUsd: number;
}

export interface DiscoverySuggestionView {
  id: string;
  title: string;
  rationale: string;
  seedKeyword: string;
  confidence: number;
}
