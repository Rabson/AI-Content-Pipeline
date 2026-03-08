import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import type { PublishRequest, PublishResponse, PublisherAdapter, PublisherCredentialInput } from '@api/modules/publisher/contracts/publisher.contract';
import { fetchWithTimeout, throwUpstreamHttpError } from '@api/common/http/external-fetch.util';
import { env } from '@api/config/env';
import {
  resolveMediumPublishPath,
  sanitizeMediumTags,
  withMediumBannerPreface,
} from './helpers/medium-adapter.helper';

@Injectable()
export class MediumAdapter implements PublisherAdapter {
  readonly channel = PublicationChannel.MEDIUM;

  async publish(input: PublishRequest, credential?: PublisherCredentialInput): Promise<PublishResponse> {
    const accessToken = credential?.accessToken?.trim();
    if (!accessToken) {
      throw new InternalServerErrorException('No Medium credential is configured for publishing');
    }

    const targetPath = await resolveMediumPublishPath({
      accessToken,
      publicationId: credential?.settings?.mediumPublicationId,
      authorId: credential?.settings?.mediumAuthorId,
    });
    const response = await fetchWithTimeout(
      `${env.mediumApiBaseUrl}${targetPath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title: input.title,
          contentFormat: 'markdown',
          content: withMediumBannerPreface(input),
          canonicalUrl: input.canonicalUrl,
          publishStatus: 'public',
          tags: sanitizeMediumTags(input.tags),
        }),
      },
      env.externalRequestTimeoutMs,
      'Medium publish',
    );

    if (!response.ok) {
      await throwUpstreamHttpError(response, 'Medium publish');
    }

    const payload = await response.json();
    const data = payload?.data ?? payload;
    return {
      externalId: String(data?.id ?? payload?.id),
      url: String(data?.url ?? payload?.url ?? input.canonicalUrl ?? ''),
      raw: payload,
    };
  }

  async verify(externalUrl: string) {
    try {
      const response = await fetchWithTimeout(externalUrl, { method: 'GET' }, env.externalRequestTimeoutMs, 'Medium verification');
      return { ok: response.ok, metadata: { status: response.status } };
    } catch (error) {
      return { ok: false, metadata: { error: error instanceof Error ? error.message : 'Verification failed' } };
    }
  }
}
