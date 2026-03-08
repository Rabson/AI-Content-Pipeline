import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { PublishRequest, PublishResponse, PublisherAdapter, PublisherCredentialInput } from './publisher-adapter.interface';

@Injectable()
export class LinkedInAdapter implements PublisherAdapter {
  readonly channel = PublicationChannel.LINKEDIN;

  async publish(_input: PublishRequest, _credential?: PublisherCredentialInput): Promise<PublishResponse> {
    throw new ServiceUnavailableException('LinkedIn article publishing is not implemented yet');
  }
}
