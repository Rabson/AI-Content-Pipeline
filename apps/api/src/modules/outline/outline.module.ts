import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@api/prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { CONTENT_PIPELINE_QUEUE } from './constants/outline.constants';
import { OutlineController } from './outline.controller';
import { OutlineWorkerController } from './outline.worker.controller';
import { OutlineService } from './outline.service';
import { OutlineRepository } from './outline.repository';
import { OutlineOrchestrator } from './outline.orchestrator';
import { OpenAiOutlineClient } from './providers/openai-outline.client';
import { OutlineValidatorService } from './providers/outline-validator.service';

@Module({
  imports: [UserModule, BullModule.registerQueue({ name: CONTENT_PIPELINE_QUEUE })],
  controllers: [OutlineController, OutlineWorkerController],
  providers: [
    PrismaService,
    OutlineService,
    OutlineRepository,
    OutlineOrchestrator,
    OpenAiOutlineClient,
    OutlineValidatorService,
  ],
  exports: [OutlineService],
})
export class OutlineModule {}
