import { TopicStatus } from '@prisma/client';

export interface TopicStatusHistoryEntity {
  id: string;
  topicId: string;
  fromStatus: TopicStatus | null;
  toStatus: TopicStatus;
  actorId: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
