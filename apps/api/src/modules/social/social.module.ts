import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@api/prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { SOCIAL_QUEUE } from './constants/social.constants';
import { SocialController } from './social.controller';
import { SocialWorkerController } from './social.worker.controller';
import { SocialOrchestrator } from './social.orchestrator';
import { SocialRepository } from './social.repository';
import { SocialService } from './social.service';
import { SocialGeneratorService } from './providers/social-generator.service';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: SOCIAL_QUEUE,
    }),
  ],
  controllers: [SocialController, SocialWorkerController],
  providers: [
    PrismaService,
    SocialRepository,
    SocialService,
    SocialOrchestrator,
    SocialGeneratorService,
  ],
})
export class SocialModule {}
