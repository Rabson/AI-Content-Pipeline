import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CONTENT_PIPELINE_QUEUE } from './constants/draft.constants';
import { DraftController } from './draft.controller';
import { DraftService } from './draft.service';
import { DraftRepository } from './draft.repository';
import { DraftOrchestrator } from './draft.orchestrator';
import { OpenAiDraftClient } from './providers/openai-draft.client';
import { DraftValidatorService } from './providers/draft-validator.service';
import { DraftReadRepository } from './repositories/draft-read.repository';
import { DraftWriteRepository } from './repositories/draft-write.repository';
import { DraftGenerationService } from './services/draft-generation.service';
import { DraftQueryService } from './services/draft-query.service';
import { DraftReviewService } from './services/draft-review.service';

@Module({
  imports: [BullModule.registerQueue({ name: CONTENT_PIPELINE_QUEUE })],
  controllers: [DraftController],
  providers: [
    PrismaService,
    DraftService,
    DraftRepository,
    DraftReadRepository,
    DraftWriteRepository,
    DraftGenerationService,
    DraftQueryService,
    DraftReviewService,
    DraftOrchestrator,
    OpenAiDraftClient,
    DraftValidatorService,
  ],
  exports: [DraftService],
})
export class DraftModule {}
