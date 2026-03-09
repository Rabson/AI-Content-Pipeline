import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ANALYTICS_QUEUE,
  CONTENT_PIPELINE_QUEUE,
  PUBLISHING_QUEUE,
  SOCIAL_QUEUE,
} from '@aicp/queue-contracts';
import {
  AppLogger,
  PrismaService,
  SECURITY_EVENT_RUNTIME_CONFIG,
  SecurityEventRepository,
  SecurityEventService,
} from '@aicp/backend-core';
import { env } from './config/env';
import {
  DRAFT_FAILURE_WRITER,
  OUTLINE_FAILURE_WRITER,
  REVISION_FAILURE_WRITER,
} from './contracts/failure-writers.contracts';
import {
  ANALYTICS_JOB_RUNNER,
  DISCOVERY_JOB_RUNNER,
  DRAFT_JOB_RUNNER,
  OUTLINE_JOB_RUNNER,
  PUBLISH_JOB_RUNNER,
  RESEARCH_JOB_RUNNER,
  REVISION_JOB_RUNNER,
  SEO_JOB_RUNNER,
  SOCIAL_JOB_RUNNER,
} from './contracts/job-runners.contracts';
import { apiWorkerBindings, apiWorkerProviders } from '@aicp/api/worker/worker.providers';
import { JobExecutionService } from './support/job-execution.service';
import { DatabaseHealthRepository } from './support/health/database-health.repository';
import { QueueHealthService } from './support/health/queue-health.service';
import { RedisHealthClient } from './support/health/redis-health.client';
import { RetryPolicyService } from './support/retry-policy.service';
import { WorkerMetricsService } from './support/worker-metrics.service';
import { WorkerHealthService } from './support/worker-health.service';
import { WorkerSocialProcessor } from './processors/social.processor';
import { WorkerAnalyticsProcessor } from './processors/analytics.processor';
import { WorkerPublishProcessor } from './processors/publish.processor';
import { WorkerContentPipelineProcessor } from './processors/content-pipeline.processor';

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
    {
      provide: SECURITY_EVENT_RUNTIME_CONFIG,
      useValue: {
        securityAlertThreshold: env.securityAlertThreshold,
        securityAlertWindowMs: env.securityAlertWindowMs,
      },
    },
    SecurityEventService,
    ...apiWorkerProviders,
    JobExecutionService,
    RetryPolicyService,
    WorkerMetricsService,
    DatabaseHealthRepository,
    RedisHealthClient,
    QueueHealthService,
    WorkerHealthService,
    WorkerContentPipelineProcessor,
    WorkerSocialProcessor,
    WorkerAnalyticsProcessor,
    WorkerPublishProcessor,
    {
      provide: DISCOVERY_JOB_RUNNER,
      useExisting: apiWorkerBindings.DiscoveryService,
    },
    {
      provide: RESEARCH_JOB_RUNNER,
      useExisting: apiWorkerBindings.ResearchOrchestrator,
    },
    {
      provide: OUTLINE_JOB_RUNNER,
      useExisting: apiWorkerBindings.OutlineOrchestrator,
    },
    {
      provide: DRAFT_JOB_RUNNER,
      useExisting: apiWorkerBindings.DraftOrchestrator,
    },
    {
      provide: REVISION_JOB_RUNNER,
      useExisting: apiWorkerBindings.RevisionOrchestrator,
    },
    {
      provide: SEO_JOB_RUNNER,
      useExisting: apiWorkerBindings.SeoOrchestrator,
    },
    {
      provide: SOCIAL_JOB_RUNNER,
      useExisting: apiWorkerBindings.SocialOrchestrator,
    },
    {
      provide: ANALYTICS_JOB_RUNNER,
      useExisting: apiWorkerBindings.AnalyticsOrchestrator,
    },
    {
      provide: PUBLISH_JOB_RUNNER,
      useExisting: apiWorkerBindings.PublisherOrchestrator,
    },
    {
      provide: DRAFT_FAILURE_WRITER,
      useExisting: apiWorkerBindings.DraftRepository,
    },
    {
      provide: OUTLINE_FAILURE_WRITER,
      useExisting: apiWorkerBindings.OutlineRepository,
    },
    {
      provide: REVISION_FAILURE_WRITER,
      useExisting: apiWorkerBindings.RevisionRepository,
    },
  ],
})
export class WorkerModule {}
