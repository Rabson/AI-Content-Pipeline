import { ConflictException } from '@nestjs/common';
import { TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import type { DiscoveryCandidate } from '../providers/discovery-provider.interface';
import { extractDiscoveryTokens } from '../utils/discovery.util';
import type { DiscoveryIngestDependencies, DiscoveryIngestOptions } from './discovery-ingest.types';

export async function scoreDiscoveryCandidate(
  deps: DiscoveryIngestDependencies,
  topicId: string,
  candidate: DiscoveryCandidate,
  title: string,
  tags: string[],
  options: DiscoveryIngestOptions,
) {
  const existingMatches = await deps.discoveryRepository.countExistingMatches(extractDiscoveryTokens(title, tags).slice(0, 4));
  const score = deps.scoringService.calculateDiscoveryHeuristic({
    tags,
    query: options.query,
    sourceType: candidate.source.startsWith('DISCOVERY_API') ? 'api' : 'manual',
    audience: candidate.audience,
    engagementScore: candidate.engagementScore,
    discussionScore: candidate.discussionScore,
    publishedAt: candidate.publishedAt,
    existingMatches,
  });

  await deps.topicRepository.transitionStatus({
    topicId,
    fromStatus: TopicStatus.SUBMITTED,
    toStatus: TopicStatus.SCORED,
    actorId: options.actorId,
    metadata: { recommendedBy: 'discovery-agent', minimumScore: options.minimumScore },
    topicUpdate: { scoreTotal: score.total, scoreBreakdown: score.breakdown },
  });
  await deps.workflowService.recordEvent({
    topicId,
    stage: WorkflowStage.TOPIC,
    eventType: WorkflowEventType.TOPIC_SCORED,
    actorId: options.actorId,
    metadata: { total: score.total, breakdown: score.breakdown, recommendedBy: 'discovery-agent' },
  });
  return score;
}

export async function rejectDiscoveryCandidate(
  deps: DiscoveryIngestDependencies,
  topicId: string,
  actorId: string,
  minimumScore: number,
  total: number,
) {
  const reason = `Discovery filter below threshold ${minimumScore}`;
  const rejected = await deps.topicRepository.transitionStatus({
    topicId,
    fromStatus: TopicStatus.SCORED,
    toStatus: TopicStatus.REJECTED,
    actorId,
    reason,
    topicUpdate: { rejectedBy: actorId, rejectedAt: new Date(), rejectionReason: reason },
  });
  if (!rejected) throw new ConflictException('Failed to filter discovery candidate');
  await deps.workflowService.syncTopicStatus({
    topicId,
    topicStatus: TopicStatus.REJECTED,
    stage: WorkflowStage.TOPIC,
    actorId,
    eventType: WorkflowEventType.TOPIC_REJECTED,
    metadata: { minimumScore, total },
  });
  return rejected;
}
