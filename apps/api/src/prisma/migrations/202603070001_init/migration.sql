-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SCORED', 'APPROVED', 'REJECTED', 'RESEARCH_QUEUED', 'RESEARCH_IN_PROGRESS', 'RESEARCH_READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentState" AS ENUM ('TOPIC_INTAKE', 'APPROVED', 'RESEARCH_IN_PROGRESS', 'RESEARCH_READY', 'OUTLINE_READY', 'DRAFT_IN_PROGRESS', 'DRAFT_READY', 'REVIEW_IN_PROGRESS', 'REVISION_IN_PROGRESS', 'READY_TO_PUBLISH', 'PUBLISH_IN_PROGRESS', 'PUBLISHED', 'DISTRIBUTION_IN_PROGRESS', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('TOPIC', 'RESEARCH', 'OUTLINE', 'DRAFT', 'REVIEW', 'REVISION', 'SEO', 'SOCIAL', 'PUBLISH', 'ANALYTICS', 'OPS');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkflowEventType" AS ENUM ('TRANSITION', 'TOPIC_CREATED', 'TOPIC_SCORED', 'TOPIC_APPROVED', 'TOPIC_REJECTED', 'ENQUEUED', 'STARTED', 'COMPLETED', 'FAILED', 'COMMENT_CREATED', 'COMMENT_UPDATED', 'REVIEW_SUBMITTED', 'DRAFT_APPROVED', 'REVISION_REQUESTED', 'SOCIAL_GENERATED', 'SOCIAL_STATUS_CHANGED', 'SEO_GENERATED', 'PUBLISH_REQUESTED', 'PUBLISHED', 'PUBLISH_FAILED', 'REPLAY_REQUESTED', 'RETRY_REQUESTED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('RESEARCH', 'OUTLINE', 'DRAFT', 'SEO', 'SOCIAL');

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DOCS', 'BLOG', 'PAPER', 'NEWS', 'INTERNAL_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "JobExecutionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "DraftVersionStatus" AS ENUM ('IN_PROGRESS', 'READY_FOR_REVIEW', 'APPROVED', 'SUPERSEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewSessionStatus" AS ENUM ('OPEN', 'SUBMITTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewCommentSeverity" AS ENUM ('NIT', 'MAJOR', 'BLOCKER');

-- CreateEnum
CREATE TYPE "ReviewCommentStatus" AS ENUM ('OPEN', 'ADDRESSED', 'WONT_FIX');

-- CreateEnum
CREATE TYPE "RevisionRunStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PublicationChannel" AS ENUM ('DEVTO');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('LINKEDIN');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'APPROVED', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "StorageObjectPurpose" AS ENUM ('IMAGE', 'EXPORT', 'ATTACHMENT', 'SOCIAL_ASSET', 'PUBLICATION_ASSET');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brief" TEXT,
    "audience" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" "TopicStatus" NOT NULL DEFAULT 'DRAFT',
    "scoreTotal" DECIMAL(5,2),
    "scoreBreakdown" JSONB,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "approvalNote" TEXT,
    "rejectionReason" TEXT,
    "contentItemId" TEXT,
    "researchJobId" TEXT,
    "researchEnqueuedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "currentState" "ContentState" NOT NULL DEFAULT 'TOPIC_INTAKE',
    "currentDraftVersionId" TEXT,
    "latestApprovedDraftVersionId" TEXT,
    "lockedForPublish" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicStatusHistory" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "fromStatus" "TopicStatus",
    "toStatus" "TopicStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "topicId" TEXT,
    "stage" "WorkflowStage" NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedBy" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "topicId" TEXT,
    "workflowRunId" TEXT,
    "eventType" "WorkflowEventType" NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "fromState" "ContentState",
    "toState" "ContentState",
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicTag" (
    "topicId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "TopicTag_pkey" PRIMARY KEY ("topicId","tag")
);

-- CreateTable
CREATE TABLE "ArtifactVersion" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "artifactType" "ArtifactType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ArtifactStatus" NOT NULL DEFAULT 'ACTIVE',
    "payloadJson" JSONB NOT NULL,
    "model" TEXT,
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtifactVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outline" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "artifactVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutlineSection" (
    "id" TEXT NOT NULL,
    "outlineId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "parentSectionId" TEXT,
    "position" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "targetWords" INTEGER NOT NULL DEFAULT 250,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutlineSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchArtifact" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "artifactVersionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPointsCount" INTEGER NOT NULL DEFAULT 0,
    "examplesCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceReference" (
    "id" TEXT NOT NULL,
    "researchArtifactId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT,
    "title" TEXT,
    "sourceType" "SourceType" NOT NULL DEFAULT 'OTHER',
    "publishedAt" TIMESTAMP(3),
    "credibilityScore" DECIMAL(3,2),
    "relevanceScore" DECIMAL(3,2),
    "excerpt" TEXT,
    "snippets" JSONB,
    "language" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchKeyPoint" (
    "id" TEXT NOT NULL,
    "researchArtifactId" TEXT NOT NULL,
    "point" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "sourceRefIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchKeyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchExample" (
    "id" TEXT NOT NULL,
    "researchArtifactId" TEXT NOT NULL,
    "exampleTitle" TEXT NOT NULL,
    "exampleBody" TEXT NOT NULL,
    "takeaway" TEXT,
    "sourceRefIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "bullJobId" TEXT,
    "topicId" TEXT,
    "contentItemId" TEXT,
    "status" "JobExecutionStatus" NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "payloadJson" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmUsageLog" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "module" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftVersion" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "artifactVersionId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "status" "DraftVersionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "assembledMarkdown" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftSection" (
    "id" TEXT NOT NULL,
    "draftVersionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "contentMd" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSession" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "draftVersionId" TEXT NOT NULL,
    "status" "ReviewSessionStatus" NOT NULL DEFAULT 'OPEN',
    "reviewerId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reviewSessionId" TEXT NOT NULL,
    "draftVersionId" TEXT NOT NULL,
    "draftSectionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "commentMd" TEXT NOT NULL,
    "severity" "ReviewCommentSeverity" NOT NULL,
    "status" "ReviewCommentStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionRun" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "reviewSessionId" TEXT NOT NULL,
    "fromDraftVersionId" TEXT NOT NULL,
    "toDraftVersionId" TEXT,
    "status" "RevisionRunStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RevisionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionItem" (
    "id" TEXT NOT NULL,
    "revisionRunId" TEXT NOT NULL,
    "draftSectionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "instructionMd" TEXT NOT NULL,
    "sourceCommentIds" JSONB,
    "status" "RevisionRunStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionDiff" (
    "id" TEXT NOT NULL,
    "revisionRunId" TEXT NOT NULL,
    "draftSectionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "beforeMd" TEXT NOT NULL,
    "afterMd" TEXT NOT NULL,
    "diffUnifiedMd" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionDiff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "artifactVersionId" TEXT,
    "slug" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openGraphTitle" TEXT,
    "openGraphDescription" TEXT,
    "model" TEXT,
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "latestVersionNumber" INTEGER NOT NULL DEFAULT 0,
    "approvedVersionNumber" INTEGER,
    "postedVersionNumber" INTEGER,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "error" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPostVersion" (
    "id" TEXT NOT NULL,
    "socialPostId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "headline" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cta" TEXT NOT NULL,
    "model" TEXT,
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "draftVersionId" TEXT,
    "channel" "PublicationChannel" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
    "lockedForPublish" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "payloadJson" JSONB,
    "error" TEXT,
    "verificationStatus" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationAttempt" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL,
    "requestPayloadJson" JSONB,
    "responsePayloadJson" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDailyUsage" (
    "id" TEXT NOT NULL,
    "usageDate" TIMESTAMP(3) NOT NULL,
    "module" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDailyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDailyOverview" (
    "id" TEXT NOT NULL,
    "usageDate" TIMESTAMP(3) NOT NULL,
    "throughputCount" INTEGER NOT NULL DEFAULT 0,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "publishCount" INTEGER NOT NULL DEFAULT 0,
    "publishCadenceCount" INTEGER NOT NULL DEFAULT 0,
    "avgLeadTimeHours" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "avgRevisionRate" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "avgApprovalLatencyHours" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDailyOverview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "contentItemId" TEXT,
    "provider" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "purpose" "StorageObjectPurpose" NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_contentItemId_key" ON "Topic"("contentItemId");

-- CreateIndex
CREATE INDEX "Topic_status_createdAt_idx" ON "Topic"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Topic_scoreTotal_idx" ON "Topic"("scoreTotal" DESC);

-- CreateIndex
CREATE INDEX "ContentItem_currentState_updatedAt_idx" ON "ContentItem"("currentState", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "TopicStatusHistory_topicId_createdAt_idx" ON "TopicStatusHistory"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowRun_contentItemId_startedAt_idx" ON "WorkflowRun"("contentItemId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowRun_stage_status_startedAt_idx" ON "WorkflowRun"("stage", "status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowEvent_contentItemId_createdAt_idx" ON "WorkflowEvent"("contentItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowEvent_topicId_createdAt_idx" ON "WorkflowEvent"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowEvent_eventType_stage_createdAt_idx" ON "WorkflowEvent"("eventType", "stage", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ArtifactVersion_topicId_artifactType_createdAt_idx" ON "ArtifactVersion"("topicId", "artifactType", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactVersion_topicId_artifactType_versionNumber_key" ON "ArtifactVersion"("topicId", "artifactType", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Outline_artifactVersionId_key" ON "Outline"("artifactVersionId");

-- CreateIndex
CREATE INDEX "Outline_topicId_createdAt_idx" ON "Outline"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OutlineSection_outlineId_position_idx" ON "OutlineSection"("outlineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "OutlineSection_outlineId_sectionKey_key" ON "OutlineSection"("outlineId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchArtifact_artifactVersionId_key" ON "ResearchArtifact"("artifactVersionId");

-- CreateIndex
CREATE INDEX "ResearchArtifact_topicId_createdAt_idx" ON "ResearchArtifact"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SourceReference_researchArtifactId_createdAt_idx" ON "SourceReference"("researchArtifactId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SourceReference_domain_idx" ON "SourceReference"("domain");

-- CreateIndex
CREATE INDEX "ResearchKeyPoint_researchArtifactId_createdAt_idx" ON "ResearchKeyPoint"("researchArtifactId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ResearchExample_researchArtifactId_createdAt_idx" ON "ResearchExample"("researchArtifactId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LlmUsageLog_topicId_createdAt_idx" ON "LlmUsageLog"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LlmUsageLog_contentItemId_createdAt_idx" ON "LlmUsageLog"("contentItemId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DraftVersion_artifactVersionId_key" ON "DraftVersion"("artifactVersionId");

-- CreateIndex
CREATE INDEX "DraftVersion_topicId_createdAt_idx" ON "DraftVersion"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DraftVersion_topicId_versionNumber_key" ON "DraftVersion"("topicId", "versionNumber");

-- CreateIndex
CREATE INDEX "DraftSection_draftVersionId_position_idx" ON "DraftSection"("draftVersionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DraftSection_draftVersionId_sectionKey_key" ON "DraftSection"("draftVersionId", "sectionKey");

-- CreateIndex
CREATE INDEX "ReviewSession_topicId_createdAt_idx" ON "ReviewSession"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ReviewSession_draftVersionId_idx" ON "ReviewSession"("draftVersionId");

-- CreateIndex
CREATE INDEX "ReviewComment_reviewSessionId_createdAt_idx" ON "ReviewComment"("reviewSessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ReviewComment_draftVersionId_sectionKey_idx" ON "ReviewComment"("draftVersionId", "sectionKey");

-- CreateIndex
CREATE INDEX "RevisionRun_topicId_createdAt_idx" ON "RevisionRun"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RevisionRun_reviewSessionId_idx" ON "RevisionRun"("reviewSessionId");

-- CreateIndex
CREATE INDEX "RevisionItem_revisionRunId_createdAt_idx" ON "RevisionItem"("revisionRunId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RevisionItem_draftSectionId_idx" ON "RevisionItem"("draftSectionId");

-- CreateIndex
CREATE INDEX "SectionDiff_revisionRunId_createdAt_idx" ON "SectionDiff"("revisionRunId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SectionDiff_draftSectionId_idx" ON "SectionDiff"("draftSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_artifactVersionId_key" ON "SeoMetadata"("artifactVersionId");

-- CreateIndex
CREATE INDEX "SeoMetadata_topicId_createdAt_idx" ON "SeoMetadata"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SeoMetadata_contentItemId_createdAt_idx" ON "SeoMetadata"("contentItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SocialPost_contentItemId_createdAt_idx" ON "SocialPost"("contentItemId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_topicId_platform_key" ON "SocialPost"("topicId", "platform");

-- CreateIndex
CREATE INDEX "SocialPostVersion_socialPostId_createdAt_idx" ON "SocialPostVersion"("socialPostId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPostVersion_socialPostId_versionNumber_key" ON "SocialPostVersion"("socialPostId", "versionNumber");

-- CreateIndex
CREATE INDEX "Publication_topicId_createdAt_idx" ON "Publication"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Publication_contentItemId_createdAt_idx" ON "Publication"("contentItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Publication_channel_status_idx" ON "Publication"("channel", "status");

-- CreateIndex
CREATE INDEX "PublicationAttempt_publicationId_createdAt_idx" ON "PublicationAttempt"("publicationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsDailyUsage_usageDate_idx" ON "AnalyticsDailyUsage"("usageDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDailyUsage_usageDate_module_model_key" ON "AnalyticsDailyUsage"("usageDate", "module", "model");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDailyOverview_usageDate_key" ON "AnalyticsDailyOverview"("usageDate");

-- CreateIndex
CREATE INDEX "AnalyticsDailyOverview_usageDate_idx" ON "AnalyticsDailyOverview"("usageDate" DESC);

-- CreateIndex
CREATE INDEX "StorageObject_contentItemId_createdAt_idx" ON "StorageObject"("contentItemId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "StorageObject_bucket_objectKey_key" ON "StorageObject"("bucket", "objectKey");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_currentDraftVersionId_fkey" FOREIGN KEY ("currentDraftVersionId") REFERENCES "DraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_latestApprovedDraftVersionId_fkey" FOREIGN KEY ("latestApprovedDraftVersionId") REFERENCES "DraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicStatusHistory" ADD CONSTRAINT "TopicStatusHistory_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicTag" ADD CONSTRAINT "TopicTag_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactVersion" ADD CONSTRAINT "ArtifactVersion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outline" ADD CONSTRAINT "Outline_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outline" ADD CONSTRAINT "Outline_artifactVersionId_fkey" FOREIGN KEY ("artifactVersionId") REFERENCES "ArtifactVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutlineSection" ADD CONSTRAINT "OutlineSection_outlineId_fkey" FOREIGN KEY ("outlineId") REFERENCES "Outline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutlineSection" ADD CONSTRAINT "OutlineSection_parentSectionId_fkey" FOREIGN KEY ("parentSectionId") REFERENCES "OutlineSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchArtifact" ADD CONSTRAINT "ResearchArtifact_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchArtifact" ADD CONSTRAINT "ResearchArtifact_artifactVersionId_fkey" FOREIGN KEY ("artifactVersionId") REFERENCES "ArtifactVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceReference" ADD CONSTRAINT "SourceReference_researchArtifactId_fkey" FOREIGN KEY ("researchArtifactId") REFERENCES "ResearchArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchKeyPoint" ADD CONSTRAINT "ResearchKeyPoint_researchArtifactId_fkey" FOREIGN KEY ("researchArtifactId") REFERENCES "ResearchArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchExample" ADD CONSTRAINT "ResearchExample_researchArtifactId_fkey" FOREIGN KEY ("researchArtifactId") REFERENCES "ResearchArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmUsageLog" ADD CONSTRAINT "LlmUsageLog_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmUsageLog" ADD CONSTRAINT "LlmUsageLog_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftVersion" ADD CONSTRAINT "DraftVersion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftVersion" ADD CONSTRAINT "DraftVersion_artifactVersionId_fkey" FOREIGN KEY ("artifactVersionId") REFERENCES "ArtifactVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftSection" ADD CONSTRAINT "DraftSection_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "DraftVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "DraftVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reviewSessionId_fkey" FOREIGN KEY ("reviewSessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "DraftVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_draftSectionId_fkey" FOREIGN KEY ("draftSectionId") REFERENCES "DraftSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRun" ADD CONSTRAINT "RevisionRun_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRun" ADD CONSTRAINT "RevisionRun_reviewSessionId_fkey" FOREIGN KEY ("reviewSessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRun" ADD CONSTRAINT "RevisionRun_fromDraftVersionId_fkey" FOREIGN KEY ("fromDraftVersionId") REFERENCES "DraftVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRun" ADD CONSTRAINT "RevisionRun_toDraftVersionId_fkey" FOREIGN KEY ("toDraftVersionId") REFERENCES "DraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionItem" ADD CONSTRAINT "RevisionItem_revisionRunId_fkey" FOREIGN KEY ("revisionRunId") REFERENCES "RevisionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionItem" ADD CONSTRAINT "RevisionItem_draftSectionId_fkey" FOREIGN KEY ("draftSectionId") REFERENCES "DraftSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionDiff" ADD CONSTRAINT "SectionDiff_revisionRunId_fkey" FOREIGN KEY ("revisionRunId") REFERENCES "RevisionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionDiff" ADD CONSTRAINT "SectionDiff_draftSectionId_fkey" FOREIGN KEY ("draftSectionId") REFERENCES "DraftSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_artifactVersionId_fkey" FOREIGN KEY ("artifactVersionId") REFERENCES "ArtifactVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostVersion" ADD CONSTRAINT "SocialPostVersion_socialPostId_fkey" FOREIGN KEY ("socialPostId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "DraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAttempt" ADD CONSTRAINT "PublicationAttempt_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

