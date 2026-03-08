import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import type { PublishRequest, PublishResponse, PublisherAdapter, PublisherCredentialInput } from '@api/modules/publisher/contracts/publisher.contract';
import { fetchWithTimeout, throwUpstreamHttpError } from '@api/common/http/external-fetch.util';
import { env } from '@api/config/env';

@Injectable()
export class LinkedInAdapter implements PublisherAdapter {
  readonly channel = PublicationChannel.LINKEDIN;

  async publish(input: PublishRequest, credential?: PublisherCredentialInput): Promise<PublishResponse> {
    const accessToken = credential?.accessToken?.trim();
    if (!accessToken) {
      throw new InternalServerErrorException('No LinkedIn credential is configured for publishing');
    }

    const authorUrn = credential?.settings?.linkedinAuthorUrn?.trim();
    if (!authorUrn) {
      throw new BadRequestException('LinkedIn author URN is required for publishing');
    }

    const response = await fetchWithTimeout(
      `${env.linkedinApiBaseUrl}/rest/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': env.linkedinApiVersion,
        },
        body: JSON.stringify({
          author: authorUrn,
          commentary: buildCommentary(input),
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: 'PUBLISHED',
          isReshareDisabledByAuthor: false,
        }),
      },
      env.externalRequestTimeoutMs,
      'LinkedIn publish',
    );

    if (!response.ok) {
      await throwUpstreamHttpError(response, 'LinkedIn publish');
    }

    const payload = await response.json();
    const externalId = String(payload?.id ?? payload?.entityUrn ?? '');
    return {
      externalId,
      url: buildLinkedInUrl(externalId),
      raw: payload,
    };
  }

  async verify(externalUrl: string) {
    try {
      const response = await fetchWithTimeout(externalUrl, { method: 'GET' }, env.externalRequestTimeoutMs, 'LinkedIn verification');
      return { ok: response.ok, metadata: { status: response.status } };
    } catch (error) {
      return { ok: false, metadata: { error: error instanceof Error ? error.message : 'Verification failed' } };
    }
  }
}

function buildCommentary(input: PublishRequest) {
  const summary = input.summary?.trim();
  const canonical = input.canonicalUrl?.trim();
  const body = summary || extractLead(input.markdown);

  return [input.title.trim(), body, canonical].filter(Boolean).join('\n\n');
}

function extractLead(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/[`#>*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function buildLinkedInUrl(externalId: string) {
  return externalId ? `https://www.linkedin.com/feed/update/${externalId}/` : 'https://www.linkedin.com/feed/';
}
