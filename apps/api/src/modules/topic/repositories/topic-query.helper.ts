import { Prisma, TopicStatus } from '@prisma/client';

export function buildTopicListWhere(params: {
  status?: TopicStatus;
  q?: string;
  minScore?: number;
  ownerUserId?: string;
}) {
  return {
    deletedAt: null,
    status: params.status,
    ownerUserId: params.ownerUserId,
    scoreTotal: params.minScore === undefined ? undefined : { gte: params.minScore },
    OR: params.q
      ? [
          { title: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
          { brief: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
        ]
      : undefined,
  } satisfies Prisma.TopicWhereInput;
}
