import { Injectable } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  listSuggestionTopics(limit: number) {
    return this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [TopicStatus.APPROVED, TopicStatus.RESEARCH_READY, TopicStatus.SCORED],
        },
      },
      include: { tags: true },
      orderBy: [{ scoreTotal: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async listCandidates(params: {
    status?: TopicStatus;
    q?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.TopicWhereInput = {
      deletedAt: null,
      source: { startsWith: 'DISCOVERY' },
      status: params.status,
      OR: params.q
        ? [
            { title: { contains: params.q, mode: 'insensitive' } },
            { brief: { contains: params.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        include: { tags: true },
        orderBy: [{ updatedAt: 'desc' }, { scoreTotal: 'desc' }],
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.topic.count({ where }),
    ]);

    return { items, total };
  }

  findExistingCandidate(slug: string, title: string) {
    return this.prisma.topic.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { slug },
          { title: { equals: title, mode: 'insensitive' } },
        ],
      },
      include: { tags: true },
    });
  }

  countExistingMatches(tokens: string[]) {
    if (!tokens.length) {
      return Promise.resolve(0);
    }

    return this.prisma.topic.count({
      where: {
        deletedAt: null,
        OR: tokens.flatMap((token) => [
          { title: { contains: token, mode: 'insensitive' } },
          { brief: { contains: token, mode: 'insensitive' } },
        ]),
      },
    });
  }
}
