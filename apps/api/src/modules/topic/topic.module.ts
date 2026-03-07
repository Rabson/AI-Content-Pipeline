import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { TopicRepository } from './topic.repository';
import { TopicScoringService } from './topic.scoring.service';
import { TopicStatusMachine } from './topic.status-machine';
import { TopicQueueService } from './topic.queue.service';
import { CONTENT_PIPELINE_QUEUE } from './constants/topic-queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { TopicCommandService } from './services/topic-command.service';
import { TopicIntakeCommandService } from './services/topic-intake-command.service';
import { TopicQueryService } from './services/topic-query.service';
import { TopicReviewCommandService } from './services/topic-review-command.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CONTENT_PIPELINE_QUEUE,
    }),
  ],
  controllers: [TopicController],
  providers: [
    PrismaService,
    TopicService,
    TopicRepository,
    TopicScoringService,
    TopicStatusMachine,
    TopicQueueService,
    TopicQueryService,
    TopicIntakeCommandService,
    TopicReviewCommandService,
    TopicCommandService,
  ],
  exports: [TopicService],
})
export class TopicModule {}
