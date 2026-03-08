import { NotFoundException } from '@nestjs/common';
import { ArtifactType, DraftVersionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

const countWords = (content: string) => content.split(/\s+/).filter(Boolean).length;

export async function createDraftShell(
  prisma: PrismaService,
  params: { topicId: string; actorId: string; payload: Record<string, unknown>; model?: string; promptHash?: string },
) {
  const latest = await prisma.draftVersion.findFirst({ where: { topicId: params.topicId }, orderBy: { versionNumber: 'desc' }, select: { versionNumber: true } });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  return prisma.$transaction(async (tx) => {
    const artifactVersion = await tx.artifactVersion.create({ data: { topicId: params.topicId, artifactType: ArtifactType.DRAFT, versionNumber, payloadJson: params.payload as Prisma.InputJsonValue, model: params.model, promptHash: params.promptHash } });
    return tx.draftVersion.create({ data: { topicId: params.topicId, artifactVersionId: artifactVersion.id, versionNumber, status: DraftVersionStatus.IN_PROGRESS, createdBy: params.actorId } });
  });
}

export function upsertDraftSection(
  prisma: PrismaService,
  params: { draftVersionId: string; sectionKey: string; heading: string; position: number; contentMd: string; model?: string; promptHash?: string },
) {
  return prisma.draftSection.upsert({
    where: { draftVersionId_sectionKey: { draftVersionId: params.draftVersionId, sectionKey: params.sectionKey } },
    update: { heading: params.heading, position: params.position, contentMd: params.contentMd, wordCount: countWords(params.contentMd), model: params.model, promptHash: params.promptHash },
    create: { draftVersionId: params.draftVersionId, sectionKey: params.sectionKey, heading: params.heading, position: params.position, contentMd: params.contentMd, wordCount: countWords(params.contentMd), model: params.model, promptHash: params.promptHash },
  });
}

export async function finalizeDraft(prisma: PrismaService, draftVersionId: string) {
  const sections = await prisma.draftSection.findMany({ where: { draftVersionId }, orderBy: { position: 'asc' } });
  if (!sections.length) throw new NotFoundException('No sections generated for draft version');
  return prisma.draftVersion.update({ where: { id: draftVersionId }, data: { status: DraftVersionStatus.READY_FOR_REVIEW, assembledMarkdown: sections.map((section) => section.contentMd).join('\n\n') }, include: { sections: { orderBy: { position: 'asc' } } } });
}

export const markDraftApproved = (prisma: PrismaService, draftVersionId: string, actorId: string) => prisma.draftVersion.update({ where: { id: draftVersionId }, data: { status: DraftVersionStatus.APPROVED, approvedBy: actorId, approvedAt: new Date() } });
export const markDraftFailed = (prisma: PrismaService, draftVersionId: string) => prisma.draftVersion.update({ where: { id: draftVersionId }, data: { status: DraftVersionStatus.FAILED } });
