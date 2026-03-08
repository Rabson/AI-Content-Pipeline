import { Injectable } from '@nestjs/common';
import {
  assertAllowedHost,
  fetchWithTimeout,
  throwUpstreamHttpError,
} from '@api/common/http/external-fetch.util';
import { env } from '@api/config/env';
import {
  DiscoveryCandidate,
  DiscoveryImportParams,
  DiscoveryProvider,
} from './discovery-provider.interface';

interface HackerNewsHit {
  objectID?: string;
  title?: string;
  story_text?: string;
  url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
}

interface HackerNewsResponse {
  hits?: HackerNewsHit[];
}

@Injectable()
export class HackerNewsDiscoveryProvider implements DiscoveryProvider {
  readonly providerName = 'hackernews';

  async fetchCandidates(params: DiscoveryImportParams): Promise<DiscoveryCandidate[]> {
    const response = await fetchWithTimeout(
      this.buildSearchUrl(params),
      { headers: { accept: 'application/json' } },
      env.externalRequestTimeoutMs,
      'Hacker News discovery',
    );

    if (!response.ok) {
      await throwUpstreamHttpError(response, 'Hacker News discovery');
    }

    const payload = (await response.json()) as HackerNewsResponse;
    return (payload.hits ?? [])
      .map((hit) => this.toCandidate(hit, params))
      .filter(Boolean) as DiscoveryCandidate[];
  }

  private buildSearchUrl(params: DiscoveryImportParams) {
    const url = assertAllowedHost(
      env.discoveryHnApiBaseUrl,
      env.discoveryAllowedHosts,
      'Hacker News discovery',
    );
    url.searchParams.set('tags', 'story');
    url.searchParams.set('hitsPerPage', String(Math.min(Math.max(params.limit, 1), 20)));
    url.searchParams.set('query', params.query?.trim() || 'ai automation');
    return url;
  }

  private toCandidate(hit: HackerNewsHit, params: DiscoveryImportParams) {
    const title = hit.title?.trim();
    if (!title) {
      return null;
    }

    return {
      title,
      brief: this.buildBrief(hit, params.query),
      audience: params.audience,
      tags: this.mergeTags(params.tags ?? [], params.query),
      source: 'DISCOVERY_API:HACKERNEWS',
      sourceUrl: hit.url || (hit.objectID ? `https://news.ycombinator.com/item?id=${hit.objectID}` : undefined),
      externalId: hit.objectID,
      publishedAt: hit.created_at,
      engagementScore: this.normalizeScore(hit.points ?? 0, 300),
      discussionScore: this.normalizeScore(hit.num_comments ?? 0, 120),
      metadata: {
        provider: this.providerName,
        author: hit.author ?? null,
        points: hit.points ?? 0,
        comments: hit.num_comments ?? 0,
        query: params.query ?? null,
      },
    } satisfies DiscoveryCandidate;
  }

  private buildBrief(hit: HackerNewsHit, query?: string) {
    if (hit.story_text?.trim()) {
      return hit.story_text.trim();
    }

    return `Recent Hacker News discussion on ${query?.trim() || 'AI automation'} with ${
      hit.points ?? 0
    } points and ${hit.num_comments ?? 0} comments.`;
  }

  private mergeTags(tags: string[], query?: string): string[] {
    const queryTags = (query ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3)
      .slice(0, 4);

    return [...new Set([...tags, ...queryTags].map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(
      0,
      12,
    );
  }

  private normalizeScore(value: number, ceiling: number): number {
    return Math.max(0, Math.min(1, value / ceiling));
  }
}
