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
import { JobExecutionService } from './support/job-execution.service';
import { ApiWorkerHttpClient } from './support/api-worker-http.client';
import { AnalyticsJobRunnerService } from './support/runners/analytics-job-runner.service';
import { DiscoveryJobRunnerService } from './support/runners/discovery-job-runner.service';
import { DraftJobRunnerService } from './support/runners/draft-job-runner.service';
import { FailureWriterService } from './support/runners/failure-writer.service';
import { OutlineJobRunnerService } from './support/runners/outline-job-runner.service';
import { PublishJobRunnerService } from './support/runners/publish-job-runner.service';
import { ResearchJobRunnerService } from './support/runners/research-job-runner.service';
import { RevisionJobRunnerService } from './support/runners/revision-job-runner.service';
import { SeoJobRunnerService } from './support/runners/seo-job-runner.service';
import { SocialJobRunnerService } from './support/runners/social-job-runner.service';
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
    ApiWorkerHttpClient,
    DiscoveryJobRunnerService,
    ResearchJobRunnerService,
    OutlineJobRunnerService,
    DraftJobRunnerService,
    RevisionJobRunnerService,
    SeoJobRunnerService,
    SocialJobRunnerService,
    AnalyticsJobRunnerService,
    PublishJobRunnerService,
    FailureWriterService,
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
      useExisting: DiscoveryJobRunnerService,
    },
    {
      provide: RESEARCH_JOB_RUNNER,
      useExisting: ResearchJobRunnerService,
    },
    {
      provide: OUTLINE_JOB_RUNNER,
      useExisting: OutlineJobRunnerService,
    },
    {
      provide: DRAFT_JOB_RUNNER,
      useExisting: DraftJobRunnerService,
    },
    {
      provide: REVISION_JOB_RUNNER,
      useExisting: RevisionJobRunnerService,
    },
    {
      provide: SEO_JOB_RUNNER,
      useExisting: SeoJobRunnerService,
    },
    {
      provide: SOCIAL_JOB_RUNNER,
      useExisting: SocialJobRunnerService,
    },
    {
      provide: ANALYTICS_JOB_RUNNER,
      useExisting: AnalyticsJobRunnerService,
    },
    {
      provide: PUBLISH_JOB_RUNNER,
      useExisting: PublishJobRunnerService,
    },
    {
      provide: DRAFT_FAILURE_WRITER,
      useExisting: FailureWriterService,
    },
    {
      provide: OUTLINE_FAILURE_WRITER,
      useExisting: FailureWriterService,
    },
    {
      provide: REVISION_FAILURE_WRITER,
      useExisting: FailureWriterService,
    },
  ],
})
export class WorkerModule {}
