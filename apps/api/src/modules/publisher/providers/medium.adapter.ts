import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { PublishRequest, PublishResponse, PublisherAdapter, PublisherCredentialInput } from './publisher-adapter.interface';

@Injectable()
export class MediumAdapter implements PublisherAdapter {
  readonly channel = PublicationChannel.MEDIUM;

  async publish(_input: PublishRequest, _credential?: PublisherCredentialInput): Promise<PublishResponse> {
    throw new ServiceUnavailableException('Medium publishing is not implemented yet');
  }
}
