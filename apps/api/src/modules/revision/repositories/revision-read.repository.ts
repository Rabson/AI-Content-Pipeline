import { Injectable } from '@nestjs/common';
import { RevisionRunStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

@Injectable()
export class RevisionReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findReviewSession(reviewSessionId: string) {
    return this.prisma.reviewSession.findUnique({
      where: { id: reviewSessionId },
      include: {
        topic: true,
        draftVersion: { include: { sections: true } },
        comments: true,
      },
    });
  }

  findRevisionRun(revisionRunId: string) {
    return this.prisma.revisionRun.findUnique({
      where: { id: revisionRunId },
      include: { items: true, sectionDiffs: true },
    });
  }

  listRevisionRuns(topicId: string) {
    return this.prisma.revisionRun.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        sectionDiffs: true,
      },
    });
  }

  findActiveRevisionRun(reviewSessionId: string) {
    return this.prisma.revisionRun.findFirst({
      where: {
        reviewSessionId,
        status: {
          in: [RevisionRunStatus.PENDING, RevisionRunStatus.IN_PROGRESS],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getDraftById(draftVersionId: string) {
    return this.prisma.draftVersion.findUnique({
      where: { id: draftVersionId },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  getDiffByVersions(topicId: string, fromVersion: number, toVersion: number) {
    return this.prisma.sectionDiff.findMany({
      where: {
        revisionRun: {
          topicId,
          fromDraftVersion: { versionNumber: fromVersion },
          toDraftVersion: { versionNumber: toVersion },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
