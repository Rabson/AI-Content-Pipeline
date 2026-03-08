import { NotFoundException } from '@nestjs/common';
import { DraftVersionStatus, Prisma, RevisionRunStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';
import { RevisionUsageRepository } from './revision-usage.repository';

const wordCount = (markdown: string) => markdown.split(/\s+/).filter(Boolean).length;

export const updateRevisedSection = (prisma: PrismaService, params: { toDraftVersionId: string; sectionKey: string; revisedMarkdown: string; model?: string; promptHash?: string }) =>
  prisma.draftSection.update({ where: { draftVersionId_sectionKey: { draftVersionId: params.toDraftVersionId, sectionKey: params.sectionKey } }, data: { contentMd: params.revisedMarkdown, wordCount: wordCount(params.revisedMarkdown), model: params.model, promptHash: params.promptHash } });

export const createSectionDiff = (prisma: PrismaService, data: Prisma.SectionDiffCreateInput) => prisma.sectionDiff.create({ data });

export async function finalizeRevisionRun(prisma: PrismaService, revisionRunId: string) {
  const run = await prisma.revisionRun.findUnique({ where: { id: revisionRunId }, include: { toDraftVersion: { include: { sections: { orderBy: { position: 'asc' } } } } } });
  if (!run?.toDraftVersion) throw new NotFoundException('Revision run missing target draft version');
  return prisma.$transaction(async (tx) => {
    await tx.revisionRun.update({ where: { id: revisionRunId }, data: { status: RevisionRunStatus.COMPLETED, completedAt: new Date() } });
    await tx.draftVersion.update({ where: { id: run.toDraftVersionId! }, data: { status: DraftVersionStatus.READY_FOR_REVIEW, assembledMarkdown: run.toDraftVersion.sections.map((section) => section.contentMd).join('\n\n') } });
    return tx.revisionRun.findUnique({ where: { id: revisionRunId }, include: { items: true, sectionDiffs: true } });
  });
}

export async function markRevisionRunFailed(prisma: PrismaService, revisionRunId: string) {
  const run = await prisma.revisionRun.findUnique({ where: { id: revisionRunId }, select: { toDraftVersionId: true } });
  return prisma.$transaction(async (tx) => {
    await tx.revisionRun.update({ where: { id: revisionRunId }, data: { status: RevisionRunStatus.FAILED, completedAt: new Date() } });
    if (run?.toDraftVersionId) await tx.draftVersion.update({ where: { id: run.toDraftVersionId }, data: { status: DraftVersionStatus.FAILED } });
    return tx.revisionRun.findUnique({ where: { id: revisionRunId } });
  });
}

export const updateRevisionItemStatus = (prisma: PrismaService, revisionItemId: string, status: RevisionRunStatus, error?: string) =>
  prisma.revisionItem.update({ where: { id: revisionItemId }, data: { status, error } });

export const createUsageLog = (usageRepository: RevisionUsageRepository, data: Prisma.LlmUsageLogCreateInput) => usageRepository.createUsageLog(data);
