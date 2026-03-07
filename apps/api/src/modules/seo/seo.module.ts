import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CONTENT_PIPELINE_QUEUE } from './constants/seo.constants';
import { SeoController } from './seo.controller';
import { SeoOrchestrator } from './seo.orchestrator';
import { SeoRepository } from './seo.repository';
import { SeoService } from './seo.service';
import { SeoGeneratorService } from './providers/seo-generator.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CONTENT_PIPELINE_QUEUE,
    }),
  ],
  controllers: [SeoController],
  providers: [
    PrismaService,
    SeoRepository,
    SeoService,
    SeoOrchestrator,
    SeoGeneratorService,
  ],
})
export class SeoModule {}
