import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@api/prisma/prisma.service';
import { PublisherModule } from '../publisher/publisher.module';
import { SystemModule } from '../system/system.module';
import { OpsController } from './ops.controller';
import { WorkerRuntimeClient } from './clients/worker-runtime.client';
import { OpsService } from './ops.service';
import { JobExecutionRepository } from './repositories/job-execution.repository';
import { JobReplayService } from './services/job-replay.service';
import { QueueMetricsService } from './services/queue-metrics.service';
import { QueueRegistryService } from './services/queue-registry.service';

@Module({
  imports: [
    SystemModule,
    PublisherModule,
    BullModule.registerQueue(
      { name: 'content.pipeline' },
      { name: 'publishing' },
      { name: 'social' },
      { name: 'analytics' },
    ),
  ],
  controllers: [OpsController],
  providers: [
    PrismaService,
    OpsService,
    WorkerRuntimeClient,
    JobExecutionRepository,
    JobReplayService,
    QueueMetricsService,
    QueueRegistryService,
  ],
})
export class OpsModule {}
