import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ANALYTICS_QUEUE,
  CONTENT_PIPELINE_QUEUE,
  PUBLISHING_QUEUE,
  SOCIAL_QUEUE,
} from '@aicp/shared-types';
import { AppLogger } from '../../api/src/common/logger/app-logger.service';
import { SecurityEventRepository } from '../../api/src/common/security/security-event.repository';
import { SecurityEventService } from '../../api/src/common/security/security-event.service';
import { PrismaService } from '../../api/src/prisma/prisma.service';
import { env } from './config/env';

import { WorkflowRepository } from '../../api/src/modules/workflow/workflow.repository';
import { WorkflowService } from '../../api/src/modules/workflow/workflow.service';
import { WorkflowTransitionService } from '../../api/src/modules/workflow/workflow-transition.service';
import { TopicRepository } from '../../api/src/modules/topic/topic.repository';
import { TopicScoringService } from '../../api/src/modules/topic/topic.scoring.service';

import { ResearchRepository } from '../../api/src/modules/research/research.repository';
import { ResearchReadRepository } from '../../api/src/modules/research/repositories/research-read.repository';
import { ResearchWriteRepository } from '../../api/src/modules/research/repositories/research-write.repository';
import { ResearchOrchestrator } from '../../api/src/modules/research/research.orchestrator';
import { SourceGathererService } from '../../api/src/modules/research/providers/source-gatherer.service';
import { SourceNormalizerService } from '../../api/src/modules/research/providers/source-normalizer.service';
import { OpenAiResearchClient } from '../../api/src/modules/research/providers/openai-research.client';
import { ResearchValidatorService } from '../../api/src/modules/research/providers/research-validator.service';

import { DraftRepository } from '../../api/src/modules/draft/draft.repository';
import { DraftReadRepository } from '../../api/src/modules/draft/repositories/draft-read.repository';
import { DraftWriteRepository } from '../../api/src/modules/draft/repositories/draft-write.repository';
import { DraftOrchestrator } from '../../api/src/modules/draft/draft.orchestrator';
import { OpenAiDraftClient } from '../../api/src/modules/draft/providers/openai-draft.client';
import { DraftValidatorService } from '../../api/src/modules/draft/providers/draft-validator.service';

import { RevisionRepository } from '../../api/src/modules/revision/revision.repository';
import { RevisionReadRepository } from '../../api/src/modules/revision/repositories/revision-read.repository';
import { RevisionUsageRepository } from '../../api/src/modules/revision/repositories/revision-usage.repository';
import { RevisionWriteRepository } from '../../api/src/modules/revision/repositories/revision-write.repository';
import { RevisionOrchestrator } from '../../api/src/modules/revision/revision.orchestrator';
import { OpenAiRevisionClient } from '../../api/src/modules/revision/providers/openai-revision.client';
import { DiffService } from '../../api/src/modules/revision/providers/diff.service';
import { OutlineRepository } from '../../api/src/modules/outline/outline.repository';
import { OutlineOrchestrator } from '../../api/src/modules/outline/outline.orchestrator';
import { OpenAiOutlineClient } from '../../api/src/modules/outline/providers/openai-outline.client';
import { OutlineValidatorService } from '../../api/src/modules/outline/providers/outline-validator.service';
import { JobExecutionService } from './support/job-execution.service';
import { DatabaseHealthRepository } from './support/health/database-health.repository';
import { QueueHealthService } from './support/health/queue-health.service';
import { RedisHealthClient } from './support/health/redis-health.client';
import { RetryPolicyService } from './support/retry-policy.service';
import { WorkerMetricsService } from './support/worker-metrics.service';
import { WorkerHealthService } from './support/worker-health.service';
import { SeoRepository } from '../../api/src/modules/seo/seo.repository';
import { SeoOrchestrator } from '../../api/src/modules/seo/seo.orchestrator';
import { SeoGeneratorService } from '../../api/src/modules/seo/providers/seo-generator.service';
import { SocialRepository } from '../../api/src/modules/social/social.repository';
import { SocialOrchestrator } from '../../api/src/modules/social/social.orchestrator';
import { SocialGeneratorService } from '../../api/src/modules/social/providers/social-generator.service';
import { WorkerSocialProcessor } from './processors/social.processor';
import { AnalyticsRepository } from '../../api/src/modules/analytics/analytics.repository';
import { AnalyticsContentRepository } from '../../api/src/modules/analytics/repositories/analytics-content.repository';
import { AnalyticsReadRepository } from '../../api/src/modules/analytics/repositories/analytics-read.repository';
import { AnalyticsRollupRepository } from '../../api/src/modules/analytics/repositories/analytics-rollup.repository';
import { AnalyticsOrchestrator } from '../../api/src/modules/analytics/analytics.orchestrator';
import { WorkerAnalyticsProcessor } from './processors/analytics.processor';
import { PublisherRepository } from '../../api/src/modules/publisher/publisher.repository';
import { PublisherOrchestrator } from '../../api/src/modules/publisher/publisher.orchestrator';
import { DevtoAdapter } from '../../api/src/modules/publisher/providers/devto.adapter';
import { LinkedInAdapter } from '../../api/src/modules/publisher/providers/linkedin.adapter';
import { MediumAdapter } from '../../api/src/modules/publisher/providers/medium.adapter';
import { PublicationVerifierService } from '../../api/src/modules/publisher/providers/publication-verifier.service';
import { PublisherRegistryService } from '../../api/src/modules/publisher/providers/publisher-registry.service';
import { WorkerPublishProcessor } from './processors/publish.processor';
import { DiscoveryService } from '../../api/src/modules/discovery/discovery.service';
import { DiscoveryRepository } from '../../api/src/modules/discovery/discovery.repository';
import { HackerNewsDiscoveryProvider } from '../../api/src/modules/discovery/providers/hacker-news-discovery.provider';
import { DiscoveryImportService } from '../../api/src/modules/discovery/services/discovery-import.service';
import { DiscoveryIngestService } from '../../api/src/modules/discovery/services/discovery-ingest.service';
import { DiscoverySuggestionService } from '../../api/src/modules/discovery/services/discovery-suggestion.service';
import { WorkerContentPipelineProcessor } from './processors/content-pipeline.processor';
import { UserPublisherCredentialRepository } from '../../api/src/modules/user/repositories/user-publisher-credential.repository';
import { TokenCryptoService } from '../../api/src/modules/user/services/token-crypto.service';
import { UserPublisherTokenResolverService } from '../../api/src/modules/user/services/user-publisher-token-resolver.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: env.redisUrl,
      },
      prefix: env.queuePrefix,
    }),
    BullModule.registerQueue(
      { name: CONTENT_PIPELINE_QUEUE },
      { name: SOCIAL_QUEUE },
      { name: PUBLISHING_QUEUE },
      { name: ANALYTICS_QUEUE },
    ),
  ],
  providers: [
    AppLogger,
    PrismaService,
    SecurityEventRepository,
    SecurityEventService,
    WorkflowRepository,
    WorkflowTransitionService,
    WorkflowService,
    TopicRepository,
    TopicScoringService,
    JobExecutionService,
    RetryPolicyService,
    WorkerMetricsService,
    DatabaseHealthRepository,
    RedisHealthClient,
    QueueHealthService,
    WorkerHealthService,

    HackerNewsDiscoveryProvider,
    DiscoveryRepository,
    DiscoverySuggestionService,
    DiscoveryIngestService,
    DiscoveryImportService,
    DiscoveryService,
    WorkerContentPipelineProcessor,

    ResearchRepository,
    ResearchReadRepository,
    ResearchWriteRepository,
    ResearchOrchestrator,
    SourceGathererService,
    SourceNormalizerService,
    OpenAiResearchClient,
    ResearchValidatorService,

    OutlineRepository,
    OutlineOrchestrator,
    OpenAiOutlineClient,
    OutlineValidatorService,

    SeoRepository,
    SeoOrchestrator,
    SeoGeneratorService,

    SocialRepository,
    SocialOrchestrator,
    SocialGeneratorService,
    WorkerSocialProcessor,

    AnalyticsRepository,
    AnalyticsContentRepository,
    AnalyticsReadRepository,
    AnalyticsRollupRepository,
    AnalyticsOrchestrator,
    WorkerAnalyticsProcessor,

    PublisherRepository,
    UserPublisherCredentialRepository,
    TokenCryptoService,
    UserPublisherTokenResolverService,
    PublisherOrchestrator,
    DevtoAdapter,
    MediumAdapter,
    LinkedInAdapter,
    PublisherRegistryService,
    PublicationVerifierService,
    WorkerPublishProcessor,

    DraftRepository,
    DraftReadRepository,
    DraftWriteRepository,
    DraftOrchestrator,
    OpenAiDraftClient,
    DraftValidatorService,

    RevisionRepository,
    RevisionReadRepository,
    RevisionUsageRepository,
    RevisionWriteRepository,
    RevisionOrchestrator,
    OpenAiRevisionClient,
    DiffService,
  ],
})
export class WorkerModule {}
