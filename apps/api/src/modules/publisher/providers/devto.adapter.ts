import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import type { PublishRequest, PublishResponse, PublisherAdapter, PublisherCredentialInput } from '@api/modules/publisher/contracts/publisher.contract';
import { fetchWithTimeout, throwUpstreamHttpError } from '@api/common/http/external-fetch.util';
import { env } from '@api/config/env';

@Injectable()
export class DevtoAdapter implements PublisherAdapter {
  readonly channel = PublicationChannel.DEVTO;

  async publish(input: PublishRequest, credential?: PublisherCredentialInput): Promise<PublishResponse> {
    const apiKey = credential?.accessToken ?? env.devtoApiKey;
    if (!apiKey) {
      throw new InternalServerErrorException('No Dev.to credential is configured for publishing');
    }

    const response = await fetchWithTimeout(
      'https://dev.to/api/articles',
      {
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
            main_image: input.coverImageUrl,
          },
        }),
      },
      env.externalRequestTimeoutMs,
      'Dev.to publish',
    );

    if (!response.ok) {
      await throwUpstreamHttpError(response, 'Dev.to publish');
    }

    const payload = await response.json();
    return {
      externalId: String(payload.id),
      url: payload.url as string,
      raw: payload,
    };
  }

  async verify(externalUrl: string) {
    try {
      const response = await fetchWithTimeout(
        externalUrl,
        { method: 'GET' },
        env.externalRequestTimeoutMs,
        'Dev.to verification',
      );
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
