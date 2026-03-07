import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { env } from '../../../config/env';
import { PublishRequest, PublishResponse, PublisherAdapter } from './publisher-adapter.interface';

@Injectable()
export class DevtoAdapter implements PublisherAdapter {
  readonly channel = PublicationChannel.DEVTO;

  async publish(input: PublishRequest): Promise<PublishResponse> {
    const apiKey = env.devtoApiKey;
    if (!apiKey) {
      throw new InternalServerErrorException('DEVTO_API_KEY is not configured');
    }

    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          title: input.title,
          body_markdown: input.markdown,
          published: true,
          canonical_url: input.canonicalUrl,
          tags: input.tags,
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Dev.to publish failed: ${response.status} ${JSON.stringify(payload)}`,
      );
    }

    return {
      externalId: String(payload.id),
      url: payload.url as string,
      raw: payload,
    };
  }

  async verify(externalUrl: string) {
    try {
      const response = await fetch(externalUrl, { method: 'GET' });
      return {
        ok: response.ok,
        metadata: {
          status: response.status,
        },
      };
    } catch (error) {
      return {
        ok: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Verification failed',
        },
      };
    }
  }
}
