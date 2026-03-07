import { Injectable } from '@nestjs/common';
import { env } from '../../../config/env';
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
    const response = await fetch(this.buildSearchUrl(params), {
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Hacker News discovery failed with status ${response.status}`);
    }

    const payload = (await response.json()) as HackerNewsResponse;
    return (payload.hits ?? [])
      .map((hit) => this.toCandidate(hit, params))
      .filter(Boolean) as DiscoveryCandidate[];
  }

  private buildSearchUrl(params: DiscoveryImportParams) {
    const url = new URL(env.discoveryHnApiBaseUrl);
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
