import { Topic } from '@prisma/client';
import { TopicEntity } from '../entities/topic.entity';

export const mapTopic = (topic: Topic): TopicEntity => ({
  ...topic,
  scoreTotal: topic.scoreTotal?.toString() ?? null,
  scoreBreakdown: (topic.scoreBreakdown as Record<string, unknown> | null) ?? null,
});
