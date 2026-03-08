import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentState, TopicStatus } from '@prisma/client';
import {
  TOPIC_TRANSITIONS,
  canContentTransition,
  canTopicTransition,
  topicToContentState,
} from '@aicp/workflow-core';

@Injectable()
export class WorkflowTransitionService {
  canTopicTransition(from: TopicStatus, to: TopicStatus): boolean {
    return canTopicTransition(from, to);
  }

  assertTopicTransition(from: TopicStatus, to: TopicStatus): void {
    if (!this.canTopicTransition(from, to)) {
      throw new BadRequestException(`Invalid topic status transition from ${from} to ${to}`);
    }
  }

  canContentTransition(from: ContentState, to: ContentState): boolean {
    return canContentTransition(from, to);
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
    return topicToContentState(topicStatus);
  }
}
