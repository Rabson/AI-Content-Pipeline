import { Injectable } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { DevtoAdapter } from './devto.adapter';
import { PublisherAdapter } from './publisher-adapter.interface';

@Injectable()
export class PublisherRegistryService {
  private readonly adapters: PublisherAdapter[];

  constructor(devtoAdapter: DevtoAdapter) {
    this.adapters = [devtoAdapter];
  }

  get(channel: PublicationChannel): PublisherAdapter {
    const adapter = this.adapters.find((candidate) => candidate.channel === channel);
    if (!adapter) {
      throw new Error(`No publisher adapter registered for ${channel}`);
    }

    return adapter;
  }
}
