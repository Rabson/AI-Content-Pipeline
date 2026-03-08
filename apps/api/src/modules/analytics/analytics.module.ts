import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@api/prisma/prisma.service';
import { AnalyticsController } from './analytics.controller';
import { ANALYTICS_QUEUE } from './constants/analytics.constants';
import { AnalyticsOrchestrator } from './analytics.orchestrator';
import { AnalyticsContentRepository } from './repositories/analytics-content.repository';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsReadRepository } from './repositories/analytics-read.repository';
import { AnalyticsRollupRepository } from './repositories/analytics-rollup.repository';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ANALYTICS_QUEUE,
    }),
  ],
  controllers: [AnalyticsController],
  providers: [
    PrismaService,
    AnalyticsRepository,
    AnalyticsContentRepository,
    AnalyticsReadRepository,
    AnalyticsRollupRepository,
    AnalyticsService,
    AnalyticsOrchestrator,
  ],
})
export class AnalyticsModule {}
