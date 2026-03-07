import { Injectable } from '@nestjs/common';
import { DiscoveryRepository } from '../discovery.repository';
import { DiscoveryQueryDto } from '../dto/discovery-query.dto';
import { assertDiscoveryEnabled, extractDiscoveryTokens } from '../utils/discovery.util';

@Injectable()
export class DiscoverySuggestionService {
  constructor(private readonly discoveryRepository: DiscoveryRepository) {}

  async suggest(query: DiscoveryQueryDto) {
    assertDiscoveryEnabled();

    const topics = await this.discoveryRepository.listSuggestionTopics(200);
    const scores = this.collectTokenScores(topics);
    const suggestions = this.buildSuggestions(scores, topics, query);

    return {
      suggestions,
      generatedAt: new Date().toISOString(),
    };
  }

  private collectTokenScores(
    topics: Awaited<ReturnType<DiscoveryRepository['listSuggestionTopics']>>,
  ) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    return topics.reduce<Map<string, { total: number; recent: number }>>((scores, topic) => {
      for (const token of extractDiscoveryTokens(topic.title, topic.tags.map((tag) => tag.tag))) {
        const current = scores.get(token) ?? { total: 0, recent: 0 };
        current.total += 1;
        if (topic.createdAt >= thirtyDaysAgo) {
          current.recent += 1;
        }
        scores.set(token, current);
      }

      return scores;
    }, new Map());
  }

  private buildSuggestions(
    scores: Map<string, { total: number; recent: number }>,
    topics: Awaited<ReturnType<DiscoveryRepository['listSuggestionTopics']>>,
    query: DiscoveryQueryDto,
  ) {
    const seenTitles = new Set(topics.map((topic) => topic.title.toLowerCase()));
    const filterQuery = query.q?.toLowerCase();

    return [...scores.entries()]
      .map(([token, card]) => this.toSuggestion(token, card, seenTitles))
      .filter((item) => !filterQuery || item.token.includes(filterQuery))
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, query.limit)
      .map((item, index) => ({
        id: `suggestion-${index + 1}`,
        title: `${item.token} for pragmatic AI content pipelines`,
        rationale: `${item.rationale} Ranked with recent-trend weighting and internal-history checks to avoid stale repeats.`,
        seedKeyword: item.token,
        confidence: Number(item.confidence.toFixed(2)),
      }));
  }

  private toSuggestion(
    token: string,
    card: { total: number; recent: number },
    seenTitles: Set<string>,
  ) {
    const momentum = card.recent * 2 + card.total;
    const noveltyPenalty = [...seenTitles].some((title) => title.includes(token)) ? 0.1 : 0;
    const confidence = Math.min(0.97, 0.35 + momentum / 30 - noveltyPenalty);

    return {
      token,
      momentum,
      confidence,
      rationale: `Recent internal momentum: ${card.recent} hits in the last 30 days and ${card.total} historical hits overall.`,
    };
  }
}
