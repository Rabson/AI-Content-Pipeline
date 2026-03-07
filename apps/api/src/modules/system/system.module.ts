import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ANALYTICS_QUEUE } from '../analytics/constants/analytics.constants';
import { PUBLISHING_QUEUE } from '../publisher/constants/publisher.constants';
import { SOCIAL_QUEUE } from '../social/constants/social.constants';
import { CONTENT_PIPELINE_QUEUE } from '../topic/constants/topic-queue.constants';
import { RedisHealthClient } from './clients/redis-health.client';
import { DatabaseHealthRepository } from './repositories/database-health.repository';
import { QueueHealthService } from './services/queue-health.service';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: CONTENT_PIPELINE_QUEUE },
      { name: SOCIAL_QUEUE },
      { name: PUBLISHING_QUEUE },
      { name: ANALYTICS_QUEUE },
    ),
  ],
  controllers: [SystemController],
  providers: [PrismaService, SystemService, DatabaseHealthRepository, RedisHealthClient, QueueHealthService],
  exports: [SystemService],
})
export class SystemModule {}
