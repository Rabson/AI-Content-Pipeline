import { Injectable } from '@nestjs/common';
import { Prisma, RevisionRunStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createRevisionRun } from './revision-run-create.helper';
import { createSectionDiff, createUsageLog, finalizeRevisionRun, markRevisionRunFailed, updateRevisedSection, updateRevisionItemStatus } from './revision-run-update.helper';
import { RevisionUsageRepository } from './revision-usage.repository';

@Injectable()
export class RevisionWriteRepository {
  constructor(private readonly prisma: PrismaService, private readonly revisionUsageRepository: RevisionUsageRepository) {}

  createRevisionRun(params: { topicId: string; reviewSessionId: string; fromDraftVersionId: string; actorId: string; items: Array<{ sectionKey: string; instructionMd: string; sourceCommentIds?: string[] }> }) { return createRevisionRun(this.prisma, params); }
  updateRevisedSection(params: { toDraftVersionId: string; sectionKey: string; revisedMarkdown: string; model?: string; promptHash?: string }) { return updateRevisedSection(this.prisma, params); }
  createSectionDiff(data: Prisma.SectionDiffCreateInput) { return createSectionDiff(this.prisma, data); }
  finalizeRevisionRun(revisionRunId: string) { return finalizeRevisionRun(this.prisma, revisionRunId); }
  updateRevisionItemStatus(revisionItemId: string, status: RevisionRunStatus, error?: string) { return updateRevisionItemStatus(this.prisma, revisionItemId, status, error); }
  markRevisionRunFailed(revisionRunId: string, _error: string) { return markRevisionRunFailed(this.prisma, revisionRunId); }
  createUsageLog(data: Prisma.LlmUsageLogCreateInput) { return createUsageLog(this.revisionUsageRepository, data); }
}
