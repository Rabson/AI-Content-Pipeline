import { InternalServerErrorException } from '@nestjs/common';
import { fetchWithTimeout, throwUpstreamHttpError } from '../../../../common/http/external-fetch.util';
import { env } from '../../../../config/env';
import type { PublishRequest } from '@aicp/shared-types';

export async function resolveMediumPublishPath(params: {
  accessToken: string;
  publicationId?: string | null;
  authorId?: string | null;
}) {
  if (params.publicationId) return `/publications/${params.publicationId}/posts`;
  if (params.authorId) return `/users/${params.authorId}/posts`;

  const response = await fetchWithTimeout(
    `${env.mediumApiBaseUrl}/me`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${params.accessToken}`, Accept: 'application/json' },
    },
    env.externalRequestTimeoutMs,
    'Medium me',
  );

  if (!response.ok) await throwUpstreamHttpError(response, 'Medium me');
  const payload = await response.json();
  const resolvedAuthorId = payload?.data?.id ?? payload?.id;
  if (!resolvedAuthorId) throw new InternalServerErrorException('Unable to resolve Medium author id');
  return `/users/${resolvedAuthorId}/posts`;
}

export function sanitizeMediumTags(tags?: string[]) {
  return (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 5);
}

export function withMediumBannerPreface(input: PublishRequest) {
  if (!input.coverImageUrl) return input.markdown;
  const alt = input.coverImageAlt?.trim() || input.title;
  return `![${alt}](${input.coverImageUrl})\n\n${input.markdown}`;
}
