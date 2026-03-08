import { ConflictException } from '@nestjs/common';
import { TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { normalizeTopicTags, slugifyTopicTitle } from '@api/modules/topic/utils/topic-normalization.util';
import type { DiscoveryCandidate } from '../providers/discovery-provider.interface';
import { discoveryJsonValue } from '../utils/discovery.util';
import type { DiscoveryIngestDependencies } from './discovery-ingest.types';

export async function prepareCandidateIngest(
  deps: DiscoveryIngestDependencies,
  candidate: DiscoveryCandidate,
  actorId: string,
) {
  const title = candidate.title.trim();
  const tags = normalizeTopicTags(candidate.tags);
  const slug = slugifyTopicTitle(title);
  const existing = await deps.discoveryRepository.findExistingCandidate(slug, title);
  if (existing) return { duplicate: toDuplicateResult(existing), title, tags, slug };

  const created = await deps.topicRepository.create({
    title,
    slug,
    brief: candidate.brief,
    audience: candidate.audience,
    source: candidate.source,
    createdBy: actorId,
    tags: tags.length ? { createMany: { data: tags.map((tag) => ({ tag })), skipDuplicates: true } } : undefined,
  });
  await deps.workflowService.ensureContentItemForTopic(created.id);
  await deps.workflowService.recordEvent({
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

  const submitted = await deps.topicRepository.transitionStatus({
    topicId: created.id,
    fromStatus: TopicStatus.DRAFT,
    toStatus: TopicStatus.SUBMITTED,
    actorId,
    reason: 'Discovery intake',
    metadata: { source: candidate.source, sourceUrl: candidate.sourceUrl ?? null, externalId: candidate.externalId ?? null },
  });
  if (!submitted) throw new ConflictException('Failed to submit discovery candidate');
  await deps.workflowService.syncTopicStatus({
    topicId: created.id,
    topicStatus: TopicStatus.SUBMITTED,
    stage: WorkflowStage.TOPIC,
    actorId,
    metadata: { source: candidate.source },
  });

  return { duplicate: null, title, tags, slug, submitted };
}

function toDuplicateResult(existing: NonNullable<Awaited<ReturnType<DiscoveryIngestDependencies['discoveryRepository']['findExistingCandidate']>>>) {
  return { topic: existing, disposition: 'duplicate' as const, scoreTotal: existing.scoreTotal === null ? null : Number(existing.scoreTotal) };
}
