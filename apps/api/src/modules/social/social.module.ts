import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SOCIAL_QUEUE } from './constants/social.constants';
import { SocialController } from './social.controller';
import { SocialOrchestrator } from './social.orchestrator';
import { SocialRepository } from './social.repository';
import { SocialService } from './social.service';
import { SocialGeneratorService } from './providers/social-generator.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SOCIAL_QUEUE,
    }),
  ],
  controllers: [SocialController],
  providers: [
    PrismaService,
    SocialRepository,
    SocialService,
    SocialOrchestrator,
    SocialGeneratorService,
  ],
})
export class SocialModule {}
