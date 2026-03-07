import { NotFoundException } from '@nestjs/common';
import { DraftVersionStatus, RevisionRunStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export async function createRevisionRun(
  prisma: PrismaService,
  params: { topicId: string; reviewSessionId: string; fromDraftVersionId: string; actorId: string; items: Array<{ sectionKey: string; instructionMd: string; sourceCommentIds?: string[] }> },
) {
  const fromDraft = await prisma.draftVersion.findUnique({ where: { id: params.fromDraftVersionId }, include: { sections: true } });
  if (!fromDraft) throw new NotFoundException('Source draft version not found');
  return prisma.$transaction(async (tx) => {
    const toDraft = await tx.draftVersion.create({ data: { topicId: params.topicId, versionNumber: fromDraft.versionNumber + 1, status: DraftVersionStatus.IN_PROGRESS, createdBy: params.actorId } });
    await tx.draftSection.createMany({ data: fromDraft.sections.map((section) => ({ draftVersionId: toDraft.id, sectionKey: section.sectionKey, heading: section.heading, position: section.position, contentMd: section.contentMd, wordCount: section.wordCount, model: section.model, promptHash: section.promptHash })) });
    const revisionRun = await tx.revisionRun.create({ data: { topicId: params.topicId, reviewSessionId: params.reviewSessionId, fromDraftVersionId: fromDraft.id, toDraftVersionId: toDraft.id, status: RevisionRunStatus.PENDING, createdBy: params.actorId, items: { create: params.items.map((item) => ({ draftSectionId: requireSourceSection(fromDraft.sections, item.sectionKey).id, sectionKey: item.sectionKey, instructionMd: item.instructionMd, sourceCommentIds: item.sourceCommentIds ?? [], status: RevisionRunStatus.PENDING })) } }, include: { items: true } });
    return { revisionRun, toDraft };
  });
}

function requireSourceSection(sections: Array<{ id: string; sectionKey: string }>, sectionKey: string) {
  const section = sections.find((item) => item.sectionKey === sectionKey);
  if (!section) throw new NotFoundException(`Section ${sectionKey} not found in source draft`);
  return section;
}
