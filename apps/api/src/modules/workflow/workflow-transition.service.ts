import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentState, TopicStatus } from '@prisma/client';

const TOPIC_TRANSITIONS: Record<TopicStatus, TopicStatus[]> = {
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

const CONTENT_TRANSITIONS: Record<ContentState, ContentState[]> = {
  TOPIC_INTAKE: [ContentState.APPROVED, ContentState.ARCHIVED, ContentState.FAILED],
  APPROVED: [ContentState.RESEARCH_IN_PROGRESS, ContentState.ARCHIVED, ContentState.FAILED],
  RESEARCH_IN_PROGRESS: [ContentState.RESEARCH_READY, ContentState.FAILED, ContentState.ARCHIVED],
  RESEARCH_READY: [ContentState.OUTLINE_READY, ContentState.FAILED, ContentState.ARCHIVED],
  OUTLINE_READY: [ContentState.DRAFT_IN_PROGRESS, ContentState.FAILED, ContentState.ARCHIVED],
  DRAFT_IN_PROGRESS: [ContentState.DRAFT_READY, ContentState.FAILED, ContentState.ARCHIVED],
  DRAFT_READY: [ContentState.REVIEW_IN_PROGRESS, ContentState.READY_TO_PUBLISH, ContentState.FAILED, ContentState.ARCHIVED],
  REVIEW_IN_PROGRESS: [ContentState.REVISION_IN_PROGRESS, ContentState.READY_TO_PUBLISH, ContentState.FAILED, ContentState.ARCHIVED],
  REVISION_IN_PROGRESS: [ContentState.DRAFT_READY, ContentState.FAILED, ContentState.ARCHIVED],
  READY_TO_PUBLISH: [ContentState.PUBLISH_IN_PROGRESS, ContentState.ARCHIVED, ContentState.FAILED],
  PUBLISH_IN_PROGRESS: [ContentState.PUBLISHED, ContentState.FAILED, ContentState.ARCHIVED],
  PUBLISHED: [ContentState.DISTRIBUTION_IN_PROGRESS, ContentState.COMPLETED, ContentState.ARCHIVED],
  DISTRIBUTION_IN_PROGRESS: [ContentState.COMPLETED, ContentState.FAILED, ContentState.ARCHIVED],
  COMPLETED: [ContentState.ARCHIVED],
  FAILED: [ContentState.APPROVED, ContentState.RESEARCH_IN_PROGRESS, ContentState.DRAFT_IN_PROGRESS, ContentState.PUBLISH_IN_PROGRESS, ContentState.ARCHIVED],
  ARCHIVED: [],
};

const TOPIC_TO_CONTENT_STATE: Partial<Record<TopicStatus, ContentState>> = {
  DRAFT: ContentState.TOPIC_INTAKE,
  SUBMITTED: ContentState.TOPIC_INTAKE,
  SCORED: ContentState.TOPIC_INTAKE,
  APPROVED: ContentState.APPROVED,
  REJECTED: ContentState.TOPIC_INTAKE,
  RESEARCH_QUEUED: ContentState.RESEARCH_IN_PROGRESS,
  RESEARCH_IN_PROGRESS: ContentState.RESEARCH_IN_PROGRESS,
  RESEARCH_READY: ContentState.RESEARCH_READY,
  FAILED: ContentState.FAILED,
  ARCHIVED: ContentState.ARCHIVED,
};

@Injectable()
export class WorkflowTransitionService {
  canTopicTransition(from: TopicStatus, to: TopicStatus): boolean {
    if (from === to) {
      return true;
    }

    return TOPIC_TRANSITIONS[from]?.includes(to) ?? false;
  }

  assertTopicTransition(from: TopicStatus, to: TopicStatus): void {
    if (!this.canTopicTransition(from, to)) {
      throw new BadRequestException(`Invalid topic status transition from ${from} to ${to}`);
    }
  }

  canContentTransition(from: ContentState, to: ContentState): boolean {
    if (from === to) {
      return true;
    }

    return CONTENT_TRANSITIONS[from]?.includes(to) ?? false;
  }

  assertContentTransition(from: ContentState, to: ContentState): void {
    if (!this.canContentTransition(from, to)) {
      throw new BadRequestException(`Invalid content state transition from ${from} to ${to}`);
    }
  }

  topicTransitions() {
    return TOPIC_TRANSITIONS;
  }

  topicToContentState(topicStatus: TopicStatus) {
    return TOPIC_TO_CONTENT_STATE[topicStatus];
  }
}
