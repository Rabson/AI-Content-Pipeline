import { Injectable } from '@nestjs/common';
import { TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { TopicRepository } from '../../topic/topic.repository';
import { TopicScoringService } from '../../topic/topic.scoring.service';
import { normalizeTopicTags, slugifyTopicTitle } from '../../topic/utils/topic-normalization.util';
import { WorkflowService } from '../../workflow/workflow.service';
import { DEFAULT_DISCOVERY_MIN_SCORE } from '../constants/discovery.constants';
import { DiscoveryRepository } from '../discovery.repository';
import { CreateDiscoveryTopicDto } from '../dto/create-discovery-topic.dto';
import { DiscoveryCandidate } from '../providers/discovery-provider.interface';
import { assertDiscoveryEnabled, discoveryJsonValue, extractDiscoveryTokens } from '../utils/discovery.util';

export interface DiscoveryIngestOptions {
  autoScore: boolean;
  minimumScore: number;
  query?: string;
  actorId: string;
}

@Injectable()
export class DiscoveryIngestService {
  constructor(
    private readonly discoveryRepository: DiscoveryRepository,
    private readonly topicRepository: TopicRepository,
    private readonly scoringService: TopicScoringService,
    private readonly workflowService: WorkflowService,
  ) {}

  createManualCandidate(dto: CreateDiscoveryTopicDto, actorId: string) {
    assertDiscoveryEnabled();

    return this.ingestCandidate(
      {
        title: dto.title,
        brief: dto.brief,
        audience: dto.audience,
        tags: dto.tags ?? [],
        source: 'DISCOVERY_MANUAL',
        sourceUrl: dto.sourceUrl,
        metadata: { provider: 'manual' },
      },
      {
        actorId,
        autoScore: dto.autoScore ?? true,
        minimumScore: dto.minimumScore ?? DEFAULT_DISCOVERY_MIN_SCORE,
      },
    );
  }

  async ingestCandidate(candidate: DiscoveryCandidate, options: DiscoveryIngestOptions) {
    const normalizedTitle = candidate.title.trim();
    const normalizedTags = normalizeTopicTags(candidate.tags);
    const slug = slugifyTopicTitle(normalizedTitle);
    const existing = await this.discoveryRepository.findExistingCandidate(slug, normalizedTitle);

    if (existing) {
      return this.toDuplicateResult(existing);
    }

    const created = await this.createCandidateTopic(candidate, normalizedTitle, slug, normalizedTags, options.actorId);
    const submitted = await this.submitCandidate(created.id, candidate, options.actorId);
    if (!options.autoScore) {
      return { topic: submitted, disposition: 'submitted' as const, scoreTotal: null };
    }

    const score = await this.scoreCandidate(submitted.id, candidate, normalizedTitle, normalizedTags, options);
    if (score.total < options.minimumScore) {
      const rejected = await this.rejectCandidate(submitted.id, options.actorId, options.minimumScore, score.total);
      return { topic: rejected, disposition: 'filtered_out' as const, scoreTotal: score.total };
    }

    const scored = await this.topicRepository.findById(submitted.id);
    if (!scored) {
      throw new Error('Scored discovery candidate not found');
    }

    return { topic: scored, disposition: 'scored' as const, scoreTotal: score.total };
  }

  private toDuplicateResult(existing: Awaited<ReturnType<DiscoveryRepository['findExistingCandidate']>>) {
    return {
      topic: existing!,
      disposition: 'duplicate' as const,
      scoreTotal: existing?.scoreTotal === null ? null : Number(existing?.scoreTotal),
    };
  }

  private async createCandidateTopic(
    candidate: DiscoveryCandidate,
    title: string,
    slug: string,
    tags: string[],
    actorId: string,
  ) {
    const created = await this.topicRepository.create({
      title,
      slug,
      brief: candidate.brief,
      audience: candidate.audience,
      source: candidate.source,
      createdBy: actorId,
      tags: tags.length
        ? {
            createMany: {
              data: tags.map((tag) => ({ tag })),
              skipDuplicates: true,
            },
          }
        : undefined,
    });

    await this.workflowService.ensureContentItemForTopic(created.id);
    await this.workflowService.recordEvent({
      topicId: created.id,
      stage: WorkflowStage.TOPIC,
      eventType: WorkflowEventType.TOPIC_CREATED,
      actorId,
      metadata: {
        source: candidate.source,
        sourceUrl: candidate.sourceUrl ?? null,
        externalId: candidate.externalId ?? null,
        publishedAt: candidate.publishedAt ?? null,
        discovery: discoveryJsonValue(candidate.metadata),
      },
    });

    return created;
  }

  private async submitCandidate(topicId: string, candidate: DiscoveryCandidate, actorId: string) {
    const submitted = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: TopicStatus.DRAFT,
      toStatus: TopicStatus.SUBMITTED,
      actorId,
      reason: 'Discovery intake',
      metadata: {
        source: candidate.source,
        sourceUrl: candidate.sourceUrl ?? null,
        externalId: candidate.externalId ?? null,
      },
    });

    if (!submitted) {
      throw new Error('Failed to submit discovery candidate');
    }

    await this.workflowService.syncTopicStatus({
      topicId,
      topicStatus: TopicStatus.SUBMITTED,
      stage: WorkflowStage.TOPIC,
      actorId,
      metadata: { source: candidate.source },
    });

    return submitted;
  }

  private async scoreCandidate(
    topicId: string,
    candidate: DiscoveryCandidate,
    title: string,
    tags: string[],
    options: DiscoveryIngestOptions,
  ) {
    const existingMatches = await this.discoveryRepository.countExistingMatches(
      extractDiscoveryTokens(title, tags).slice(0, 4),
    );
    const heuristicScore = this.scoringService.calculateDiscoveryHeuristic({
      tags,
      query: options.query,
      sourceType: candidate.source.startsWith('DISCOVERY_API') ? 'api' : 'manual',
      audience: candidate.audience,
      engagementScore: candidate.engagementScore,
      discussionScore: candidate.discussionScore,
      publishedAt: candidate.publishedAt,
      existingMatches,
    });

    await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: TopicStatus.SUBMITTED,
      toStatus: TopicStatus.SCORED,
      actorId: options.actorId,
      metadata: {
        recommendedBy: 'discovery-agent',
        minimumScore: options.minimumScore,
      },
      topicUpdate: {
        scoreTotal: heuristicScore.total,
        scoreBreakdown: heuristicScore.breakdown,
      },
    });

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.TOPIC,
      eventType: WorkflowEventType.TOPIC_SCORED,
      actorId: options.actorId,
      metadata: {
        total: heuristicScore.total,
        breakdown: heuristicScore.breakdown,
        recommendedBy: 'discovery-agent',
      },
    });

    return heuristicScore;
  }

  private async rejectCandidate(topicId: string, actorId: string, minimumScore: number, total: number) {
    const reason = `Discovery filter below threshold ${minimumScore}`;
    const rejected = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: TopicStatus.SCORED,
      toStatus: TopicStatus.REJECTED,
      actorId,
      reason,
      topicUpdate: {
        rejectedBy: actorId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    if (!rejected) {
      throw new Error('Failed to filter discovery candidate');
    }

    await this.workflowService.syncTopicStatus({
      topicId,
      topicStatus: TopicStatus.REJECTED,
      stage: WorkflowStage.TOPIC,
      actorId,
      eventType: WorkflowEventType.TOPIC_REJECTED,
      metadata: {
        minimumScore,
        total,
      },
    });

    return rejected;
  }
}
