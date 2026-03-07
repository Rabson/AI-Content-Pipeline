import { BadRequestException } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<TopicStatus, TopicStatus[]> = {
  DRAFT: [TopicStatus.SUBMITTED, TopicStatus.ARCHIVED],
  SUBMITTED: [TopicStatus.SCORED, TopicStatus.REJECTED, TopicStatus.ARCHIVED],
  SCORED: [TopicStatus.APPROVED, TopicStatus.REJECTED, TopicStatus.ARCHIVED],
  APPROVED: [TopicStatus.RESEARCH_QUEUED, TopicStatus.ARCHIVED],
  REJECTED: [TopicStatus.DRAFT, TopicStatus.ARCHIVED],
  RESEARCH_QUEUED: [TopicStatus.RESEARCH_IN_PROGRESS, TopicStatus.FAILED, TopicStatus.ARCHIVED],
  RESEARCH_IN_PROGRESS: [TopicStatus.RESEARCH_READY, TopicStatus.FAILED, TopicStatus.ARCHIVED],
  RESEARCH_READY: [TopicStatus.ARCHIVED],
  FAILED: [TopicStatus.SUBMITTED, TopicStatus.ARCHIVED],
  ARCHIVED: [],
};

export function assertTopicTransition(from: TopicStatus, to: TopicStatus): void {
  if (from === to) {
    return;
  }

  const isAllowed = ALLOWED_TRANSITIONS[from]?.includes(to);
  if (!isAllowed) {
    throw new BadRequestException(
      `Invalid topic status transition from ${from} to ${to}`,
    );
  }
}
