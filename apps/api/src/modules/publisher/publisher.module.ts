import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '@api/prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { PUBLISHING_QUEUE } from './constants/publisher.constants';
import { PublisherController } from './publisher.controller';
import { PublisherWorkerController } from './publisher.worker.controller';
import { PublisherOrchestrator } from './publisher.orchestrator';
import { PublisherRepository } from './publisher.repository';
import { PublisherService } from './publisher.service';
import { DevtoAdapter } from './providers/devto.adapter';
import { LinkedInAdapter } from './providers/linkedin.adapter';
import { MediumAdapter } from './providers/medium.adapter';
import { PublicationVerifierService } from './providers/publication-verifier.service';
import { PublisherRegistryService } from './providers/publisher-registry.service';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: PUBLISHING_QUEUE,
    }),
  ],
  controllers: [PublisherController, PublisherWorkerController],
  providers: [
    PrismaService,
    PublisherRepository,
    PublisherOrchestrator,
    PublisherService,
    DevtoAdapter,
    MediumAdapter,
    LinkedInAdapter,
    PublisherRegistryService,
    PublicationVerifierService,
  ],
  exports: [PublisherService, PublisherRepository],
})
export class PublisherModule {}
