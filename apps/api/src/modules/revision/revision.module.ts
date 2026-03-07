import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CONTENT_PIPELINE_QUEUE } from './constants/revision.constants';
import { RevisionController } from './revision.controller';
import { RevisionService } from './revision.service';
import { RevisionRepository } from './revision.repository';
import { RevisionOrchestrator } from './revision.orchestrator';
import { OpenAiRevisionClient } from './providers/openai-revision.client';
import { DiffService } from './providers/diff.service';
import { RevisionReadRepository } from './repositories/revision-read.repository';
import { RevisionUsageRepository } from './repositories/revision-usage.repository';
import { RevisionWriteRepository } from './repositories/revision-write.repository';

@Module({
  imports: [BullModule.registerQueue({ name: CONTENT_PIPELINE_QUEUE })],
  controllers: [RevisionController],
  providers: [
    PrismaService,
    RevisionService,
    RevisionRepository,
    RevisionReadRepository,
    RevisionUsageRepository,
    RevisionWriteRepository,
    RevisionOrchestrator,
    OpenAiRevisionClient,
    DiffService,
  ],
  exports: [RevisionService],
})
export class RevisionModule {}
