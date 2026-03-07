import { Injectable } from '@nestjs/common';
import { DraftVersionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DraftReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return this.prisma.topic.findFirst({ where: { id: topicId, deletedAt: null } });
  }

  getLatestOutline(topicId: string) {
    return this.prisma.outline.findFirst({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  findInProgressDraft(topicId: string) {
    return this.prisma.draftVersion.findFirst({
      where: {
        topicId,
        status: DraftVersionStatus.IN_PROGRESS,
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  listDraftVersions(topicId: string, skip: number, take: number) {
    return this.prisma.draftVersion.findMany({
      where: { topicId },
      orderBy: { versionNumber: 'desc' },
      skip,
      take,
      include: {
        sections: {
          orderBy: { position: 'asc' },
          select: { id: true, sectionKey: true, heading: true, position: true, wordCount: true },
        },
      },
    });
  }

  getDraftByVersion(topicId: string, versionNumber: number) {
    return this.prisma.draftVersion.findFirst({
      where: { topicId, versionNumber },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  getLatestDraft(topicId: string) {
    return this.prisma.draftVersion.findFirst({
      where: { topicId },
      orderBy: { versionNumber: 'desc' },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  getLatestDraftById(draftVersionId: string) {
    return this.prisma.draftVersion.findUnique({
      where: { id: draftVersionId },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  findReviewSession(reviewSessionId: string) {
    return this.prisma.reviewSession.findUnique({
      where: { id: reviewSessionId },
      include: {
        draftVersion: { include: { sections: true } },
        comments: { orderBy: { createdAt: 'desc' } },
        topic: true,
      },
    });
  }

  listReviewSessions(topicId: string) {
    return this.prisma.reviewSession.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  listSectionComments(draftVersionId: string, sectionKey: string) {
    return this.prisma.reviewComment.findMany({
      where: {
        draftVersionId,
        sectionKey,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
