import { Injectable } from '@nestjs/common';
import { ScoreTopicDto } from './dto/score-topic.dto';

interface DiscoveryHeuristicInput {
  tags?: string[];
  query?: string;
  sourceType: 'manual' | 'api';
  audience?: string;
  engagementScore?: number;
  discussionScore?: number;
  publishedAt?: string;
  existingMatches?: number;
}

@Injectable()
export class TopicScoringService {
  calculate(dto: ScoreTopicDto): {
    total: number;
    breakdown: Record<string, number>;
  } {
    const weighted = {
      novelty: dto.novelty * 0.2,
      businessValue: dto.businessValue * 0.3,
      effort: (10 - dto.effort) * 0.15,
      audienceFit: dto.audienceFit * 0.25,
      timeRelevance: dto.timeRelevance * 0.1,
    };

    const total = Number(
      (
        weighted.novelty +
        weighted.businessValue +
        weighted.effort +
        weighted.audienceFit +
        weighted.timeRelevance
      ).toFixed(2),
    );

    return {
      total,
      breakdown: {
        ...weighted,
        rawNovelty: dto.novelty,
        rawBusinessValue: dto.businessValue,
        rawEffort: dto.effort,
        rawAudienceFit: dto.audienceFit,
        rawTimeRelevance: dto.timeRelevance,
      },
    };
  }

  calculateDiscoveryHeuristic(input: DiscoveryHeuristicInput) {
    const engagement = this.clamp01(input.engagementScore ?? (input.sourceType === 'manual' ? 0.55 : 0.45));
    const discussion = this.clamp01(input.discussionScore ?? 0.35);
    const tagDensity = Math.min(1, ((input.tags?.length ?? 0) + (input.query ? 1 : 0)) / 6);
    const recency = this.recencyScore(input.publishedAt);
    const existingMatches = Math.max(0, input.existingMatches ?? 0);

    const dto: ScoreTopicDto = {
      novelty: this.clamp10(8 - existingMatches * 1.25),
      businessValue: this.clamp10(4 + engagement * 4 + discussion * 2),
      effort: this.clamp10(6 - Math.min(2, tagDensity * 2) - (input.sourceType === 'manual' ? 0.5 : 0)),
      audienceFit: this.clamp10(4 + tagDensity * 4 + (input.audience ? 1 : 0)),
      timeRelevance: this.clamp10(3 + recency * 7),
      notes: 'discovery-heuristic',
    };

    const score = this.calculate(dto);
    return {
      total: score.total,
      breakdown: {
        ...score.breakdown,
        heuristic: true,
        sourceType: input.sourceType,
        engagement,
        discussion,
        tagDensity,
        recency,
        existingMatches,
      },
    };
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private clamp10(value: number): number {
    return Math.max(0, Math.min(10, Number(value.toFixed(2))));
  }

  private recencyScore(publishedAt?: string): number {
    if (!publishedAt) {
      return 0.6;
    }

    const published = new Date(publishedAt);
    if (Number.isNaN(published.getTime())) {
      return 0.6;
    }

    const hours = Math.max(0, (Date.now() - published.getTime()) / 36e5);
    if (hours <= 24) {
      return 1;
    }
    if (hours <= 72) {
      return 0.85;
    }
    if (hours <= 168) {
      return 0.7;
    }
    if (hours <= 720) {
      return 0.45;
    }
    return 0.25;
  }
}
