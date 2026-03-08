import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { CONTENT_PIPELINE_QUEUE } from './constants/research.constants';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchRepository } from './research.repository';
import { ResearchOrchestrator } from './research.orchestrator';
import { SourceGathererService } from './providers/source-gatherer.service';
import { SourceNormalizerService } from './providers/source-normalizer.service';
import { OpenAiResearchClient } from './providers/openai-research.client';
import { ResearchValidatorService } from './providers/research-validator.service';
import { ResearchReadRepository } from './repositories/research-read.repository';
import { ResearchWriteRepository } from './repositories/research-write.repository';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: CONTENT_PIPELINE_QUEUE,
    }),
  ],
  controllers: [ResearchController],
  providers: [
    PrismaService,
    ResearchService,
    ResearchRepository,
    ResearchReadRepository,
    ResearchWriteRepository,
    ResearchOrchestrator,
    SourceGathererService,
    SourceNormalizerService,
    OpenAiResearchClient,
    ResearchValidatorService,
  ],
  exports: [ResearchService],
})
export class ResearchModule {}
