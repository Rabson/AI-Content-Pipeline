import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import type { PublisherAdapter } from '@aicp/shared-types';
import { DevtoAdapter } from './devto.adapter';
import { LinkedInAdapter } from './linkedin.adapter';
import { MediumAdapter } from './medium.adapter';

@Injectable()
export class PublisherRegistryService {
  private readonly adapters: PublisherAdapter[];

  constructor(
    devtoAdapter: DevtoAdapter,
    mediumAdapter: MediumAdapter,
    linkedinAdapter: LinkedInAdapter,
  ) {
    this.adapters = [devtoAdapter, mediumAdapter, linkedinAdapter];
  }

  get(channel: PublicationChannel): PublisherAdapter {
    const adapter = this.adapters.find((candidate) => candidate.channel === channel);
    if (!adapter) {
      throw new InternalServerErrorException(`No publisher adapter registered for ${channel}`);
    }

    return adapter;
  }
}
