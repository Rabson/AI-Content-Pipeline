import { Injectable } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { PublisherRegistryService } from './publisher-registry.service';

@Injectable()
export class PublicationVerifierService {
  constructor(private readonly registry: PublisherRegistryService) {}

  async verify(channel: PublicationChannel, externalUrl?: string | null) {
    if (!externalUrl) {
      return {
        ok: false,
        metadata: { reason: 'missing_external_url' },
      };
    }

    const adapter = this.registry.get(channel);
    if (!adapter.verify) {
      return {
        ok: true,
        metadata: { skipped: true },
      };
    }

    return adapter.verify(externalUrl);
  }
}
