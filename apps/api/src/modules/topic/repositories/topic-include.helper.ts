import { Prisma } from '@prisma/client';

export const topicOwnerSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} satisfies Prisma.UserSelect;

export const topicDetailInclude = {
  tags: true,
  owner: { select: topicOwnerSelect },
  bannerImage: true,
} satisfies Prisma.TopicInclude;
