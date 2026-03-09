import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@api/prisma/prisma.service';
import { TopicRepository } from '../topic/topic.repository';
import { TopicScoringService } from '../topic/topic.scoring.service';
import { CONTENT_PIPELINE_QUEUE } from '../topic/constants/topic-queue.constants';
import { WorkflowRepository } from '../workflow/workflow.repository';
import { WorkflowService } from '../workflow/workflow.service';
import { DISCOVERY_PROVIDER_HACKER_NEWS } from './constants/discovery.constants';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryWorkerController } from './discovery.worker.controller';
import { DiscoveryRepository } from './discovery.repository';
import { DiscoveryQueueService } from './discovery.queue.service';
import { DiscoveryService } from './discovery.service';
import { HackerNewsDiscoveryProvider } from './providers/hacker-news-discovery.provider';
import { DiscoveryImportService } from './services/discovery-import.service';
import { DiscoveryIngestService } from './services/discovery-ingest.service';
import { DiscoverySuggestionService } from './services/discovery-suggestion.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CONTENT_PIPELINE_QUEUE,
    }),
  ],
  controllers: [DiscoveryController, DiscoveryWorkerController],
  providers: [
    PrismaService,
    DiscoveryRepository,
    TopicRepository,
    TopicScoringService,
    WorkflowRepository,
    WorkflowService,
    DiscoveryQueueService,
    HackerNewsDiscoveryProvider,
    DiscoverySuggestionService,
    DiscoveryIngestService,
    DiscoveryImportService,
    DiscoveryService,
    {
      provide: DISCOVERY_PROVIDER_HACKER_NEWS,
      useExisting: HackerNewsDiscoveryProvider,
    },
  ],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
