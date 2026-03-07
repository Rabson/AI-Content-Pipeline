import { TopicStatus } from '@prisma/client';

export const TOPIC_TERMINAL_STATUSES: TopicStatus[] = [
  TopicStatus.ARCHIVED,
  TopicStatus.RESEARCH_READY,
];

export const APPROVAL_REQUIRED_STATUSES: TopicStatus[] = [
  TopicStatus.SUBMITTED,
  TopicStatus.SCORED,
];
