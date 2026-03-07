import { Injectable, NotFoundException } from '@nestjs/common';
import { DraftVersionStatus, Prisma, PrismaClient, RevisionRunStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RevisionUsageRepository } from './revision-usage.repository';

type RevisionTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

function wordCount(markdown: string) {
  return markdown.split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class RevisionWriteRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revisionUsageRepository: RevisionUsageRepository,
  ) {}

  async createRevisionRun(params: {
    topicId: string;
    reviewSessionId: string;
    fromDraftVersionId: string;
    actorId: string;
    items: Array<{ sectionKey: string; instructionMd: string; sourceCommentIds?: string[] }>;
  }) {
    const fromDraft = await this.prisma.draftVersion.findUnique({
      where: { id: params.fromDraftVersionId },
      include: { sections: true },
    });

    if (!fromDraft) {
      throw new NotFoundException('Source draft version not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const toDraft = await this.createTargetDraft(tx, params.topicId, fromDraft.versionNumber + 1, params.actorId);
      await this.copySections(tx, toDraft.id, fromDraft.sections);
      const revisionRun = await this.createRunRecord(tx, params, fromDraft.sections, fromDraft.id, toDraft.id);
      return { revisionRun, toDraft };
    });
  }

  updateRevisedSection(params: {
    toDraftVersionId: string;
    sectionKey: string;
    revisedMarkdown: string;
    model?: string;
    promptHash?: string;
  }) {
    return this.prisma.draftSection.update({
      where: {
        draftVersionId_sectionKey: {
          draftVersionId: params.toDraftVersionId,
          sectionKey: params.sectionKey,
        },
      },
      data: {
        contentMd: params.revisedMarkdown,
        wordCount: wordCount(params.revisedMarkdown),
        model: params.model,
        promptHash: params.promptHash,
      },
    });
  }

  createSectionDiff(data: Prisma.SectionDiffCreateInput) {
    return this.prisma.sectionDiff.create({ data });
  }

  async finalizeRevisionRun(revisionRunId: string) {
    const run = await this.prisma.revisionRun.findUnique({
      where: { id: revisionRunId },
      include: {
        toDraftVersion: { include: { sections: { orderBy: { position: 'asc' } } } },
      },
    });

    if (!run?.toDraftVersion) {
      throw new NotFoundException('Revision run missing target draft version');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.completeRevisionRun(tx, revisionRunId);
      await this.markTargetDraftReady(tx, run.toDraftVersionId!, run.toDraftVersion.sections);
      return tx.revisionRun.findUnique({
        where: { id: revisionRunId },
        include: { items: true, sectionDiffs: true },
      });
    });
  }

  updateRevisionItemStatus(revisionItemId: string, status: RevisionRunStatus, error?: string) {
    return this.prisma.revisionItem.update({
      where: { id: revisionItemId },
      data: { status, error },
    });
  }

  async markRevisionRunFailed(revisionRunId: string, _error: string) {
    const run = await this.prisma.revisionRun.findUnique({
      where: { id: revisionRunId },
      select: { toDraftVersionId: true },
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.revisionRun.update({
        where: { id: revisionRunId },
        data: {
          status: RevisionRunStatus.FAILED,
          completedAt: new Date(),
        },
      });

      if (run?.toDraftVersionId) {
        await tx.draftVersion.update({
          where: { id: run.toDraftVersionId },
          data: { status: DraftVersionStatus.FAILED },
        });
      }

      return tx.revisionRun.findUnique({
        where: { id: revisionRunId },
      });
    });
  }

  createUsageLog(data: Prisma.LlmUsageLogCreateInput) {
    return this.revisionUsageRepository.createUsageLog(data);
  }

  private createTargetDraft(tx: RevisionTx, topicId: string, versionNumber: number, actorId: string) {
    return tx.draftVersion.create({
      data: {
        topicId,
        versionNumber,
        status: DraftVersionStatus.IN_PROGRESS,
        createdBy: actorId,
      },
    });
  }

  private copySections(
    tx: RevisionTx,
    draftVersionId: string,
    sections: Array<{
      sectionKey: string;
      heading: string;
      position: number;
      contentMd: string;
      wordCount: number | null;
      model: string | null;
      promptHash: string | null;
    }>,
  ) {
    return tx.draftSection.createMany({
      data: sections.map((section) => ({
        draftVersionId,
        sectionKey: section.sectionKey,
        heading: section.heading,
        position: section.position,
        contentMd: section.contentMd,
        wordCount: section.wordCount,
        model: section.model,
        promptHash: section.promptHash,
      })),
    });
  }

  private createRunRecord(
    tx: RevisionTx,
    params: {
      topicId: string;
      reviewSessionId: string;
      actorId: string;
      items: Array<{ sectionKey: string; instructionMd: string; sourceCommentIds?: string[] }>;
    },
    sourceSections: Array<{ id: string; sectionKey: string }>,
    fromDraftVersionId: string,
    toDraftVersionId: string,
  ) {
    return tx.revisionRun.create({
      data: {
        topicId: params.topicId,
        reviewSessionId: params.reviewSessionId,
        fromDraftVersionId,
        toDraftVersionId,
        status: RevisionRunStatus.PENDING,
        createdBy: params.actorId,
        items: {
          create: params.items.map((item) => ({
            draftSectionId: this.requireSourceSection(sourceSections, item.sectionKey).id,
            sectionKey: item.sectionKey,
            instructionMd: item.instructionMd,
            sourceCommentIds: item.sourceCommentIds ?? [],
            status: RevisionRunStatus.PENDING,
          })),
        },
      },
      include: { items: true },
    });
  }

  private requireSourceSection(
    sections: Array<{ id: string; sectionKey: string }>,
    sectionKey: string,
  ) {
    const section = sections.find((item) => item.sectionKey === sectionKey);
    if (!section) {
      throw new NotFoundException(`Section ${sectionKey} not found in source draft`);
    }

    return section;
  }

  private completeRevisionRun(tx: RevisionTx, revisionRunId: string) {
    return tx.revisionRun.update({
      where: { id: revisionRunId },
      data: {
        status: RevisionRunStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  private markTargetDraftReady(
    tx: RevisionTx,
    draftVersionId: string,
    sections: Array<{ contentMd: string }>,
  ) {
    return tx.draftVersion.update({
      where: { id: draftVersionId },
      data: {
        status: DraftVersionStatus.READY_FOR_REVIEW,
        assembledMarkdown: sections.map((section) => section.contentMd).join('\n\n'),
      },
    });
  }
}
