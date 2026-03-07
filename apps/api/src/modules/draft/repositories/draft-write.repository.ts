import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ArtifactType,
  DraftVersionStatus,
  Prisma,
  ReviewCommentSeverity,
  ReviewCommentStatus,
  ReviewSessionStatus,
} from '@prisma/client';
import { estimateLlmCostUsd } from '../../../common/llm/usage-cost.util';
import { PrismaService } from '../../../prisma/prisma.service';

function countWords(content: string) {
  return content.split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class DraftWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDraftShell(params: {
    topicId: string;
    actorId: string;
    payload: Record<string, unknown>;
    model?: string;
    promptHash?: string;
  }) {
    const versionNumber = await this.getNextDraftVersion(params.topicId);

    return this.prisma.$transaction(async (tx) => {
      const artifactVersion = await tx.artifactVersion.create({
        data: {
          topicId: params.topicId,
          artifactType: ArtifactType.DRAFT,
          versionNumber,
          payloadJson: params.payload as Prisma.InputJsonValue,
          model: params.model,
          promptHash: params.promptHash,
        },
      });

      return tx.draftVersion.create({
        data: {
          topicId: params.topicId,
          artifactVersionId: artifactVersion.id,
          versionNumber,
          status: DraftVersionStatus.IN_PROGRESS,
          createdBy: params.actorId,
        },
      });
    });
  }

  upsertDraftSection(params: {
    draftVersionId: string;
    sectionKey: string;
    heading: string;
    position: number;
    contentMd: string;
    model?: string;
    promptHash?: string;
  }) {
    const wordCount = countWords(params.contentMd);

    return this.prisma.draftSection.upsert({
      where: {
        draftVersionId_sectionKey: {
          draftVersionId: params.draftVersionId,
          sectionKey: params.sectionKey,
        },
      },
      update: {
        heading: params.heading,
        position: params.position,
        contentMd: params.contentMd,
        wordCount,
        model: params.model,
        promptHash: params.promptHash,
      },
      create: {
        draftVersionId: params.draftVersionId,
        sectionKey: params.sectionKey,
        heading: params.heading,
        position: params.position,
        contentMd: params.contentMd,
        wordCount,
        model: params.model,
        promptHash: params.promptHash,
      },
    });
  }

  async finalizeDraft(draftVersionId: string) {
    const sections = await this.prisma.draftSection.findMany({
      where: { draftVersionId },
      orderBy: { position: 'asc' },
    });

    if (!sections.length) {
      throw new NotFoundException('No sections generated for draft version');
    }

    return this.prisma.draftVersion.update({
      where: { id: draftVersionId },
      data: {
        status: DraftVersionStatus.READY_FOR_REVIEW,
        assembledMarkdown: sections.map((section) => section.contentMd).join('\n\n'),
      },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  createReviewSession(params: { topicId: string; draftVersionId: string; reviewerId: string }) {
    return this.prisma.reviewSession.create({
      data: {
        topicId: params.topicId,
        draftVersionId: params.draftVersionId,
        reviewerId: params.reviewerId,
        status: ReviewSessionStatus.OPEN,
      },
    });
  }

  async createReviewComment(params: {
    reviewSessionId: string;
    draftVersionId: string;
    sectionKey: string;
    commentMd: string;
    severity: ReviewCommentSeverity;
    actorId: string;
  }) {
    const section = await this.prisma.draftSection.findFirst({
      where: {
        draftVersionId: params.draftVersionId,
        sectionKey: params.sectionKey,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found for this draft version');
    }

    return this.prisma.reviewComment.create({
      data: {
        reviewSessionId: params.reviewSessionId,
        draftVersionId: params.draftVersionId,
        draftSectionId: section.id,
        sectionKey: params.sectionKey,
        commentMd: params.commentMd,
        severity: params.severity,
        createdBy: params.actorId,
      },
    });
  }

  updateReviewComment(
    reviewSessionId: string,
    commentId: string,
    data: { status?: ReviewCommentStatus; resolutionNote?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reviewComment.updateMany({
        where: { id: commentId, reviewSessionId },
        data,
      });

      if (updated.count !== 1) {
        throw new NotFoundException('Review comment not found');
      }

      return tx.reviewComment.findUniqueOrThrow({
        where: { id: commentId },
      });
    });
  }

  submitReviewSession(reviewSessionId: string) {
    return this.prisma.reviewSession.update({
      where: { id: reviewSessionId },
      data: {
        status: ReviewSessionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  markDraftApproved(draftVersionId: string, actorId: string) {
    return this.prisma.draftVersion.update({
      where: { id: draftVersionId },
      data: {
        status: DraftVersionStatus.APPROVED,
        approvedBy: actorId,
        approvedAt: new Date(),
      },
    });
  }

  markDraftFailed(draftVersionId: string) {
    return this.prisma.draftVersion.update({
      where: { id: draftVersionId },
      data: {
        status: DraftVersionStatus.FAILED,
      },
    });
  }

  createUsageLog(data: Prisma.LlmUsageLogCreateInput) {
    const payload = data as unknown as Prisma.LlmUsageLogUncheckedCreateInput & {
      topic?: { connect?: { id?: string } };
    };
    const topicId = payload.topicId ?? payload.topic?.connect?.id;

    return this.prisma.$transaction(async (tx) => {
      const topic = topicId
        ? await tx.topic.findUnique({
            where: { id: topicId },
            select: { contentItemId: true },
          })
        : null;

      return tx.llmUsageLog.create({
        data: {
          ...data,
          contentItem: topic?.contentItemId ? { connect: { id: topic.contentItemId } } : undefined,
          costUsd:
            payload.costUsd ??
            estimateLlmCostUsd({
              model: String(payload.model),
              promptTokens: Number(payload.promptTokens),
              completionTokens: Number(payload.completionTokens),
            }),
        },
      });
    });
  }

  private async getNextDraftVersion(topicId: string): Promise<number> {
    const latest = await this.prisma.draftVersion.findFirst({
      where: { topicId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return (latest?.versionNumber ?? 0) + 1;
  }
}
