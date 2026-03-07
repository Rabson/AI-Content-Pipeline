import { Injectable } from '@nestjs/common';
import { Prisma, RevisionRunStatus } from '@prisma/client';
import { RevisionReadRepository } from './repositories/revision-read.repository';
import { RevisionWriteRepository } from './repositories/revision-write.repository';

@Injectable()
export class RevisionRepository {
  constructor(
    private readonly readRepository: RevisionReadRepository,
    private readonly writeRepository: RevisionWriteRepository,
  ) {}

  findReviewSession(reviewSessionId: string) {
    return this.readRepository.findReviewSession(reviewSessionId);
  }

  findRevisionRun(revisionRunId: string) {
    return this.readRepository.findRevisionRun(revisionRunId);
  }

  listRevisionRuns(topicId: string) {
    return this.readRepository.listRevisionRuns(topicId);
  }

  findActiveRevisionRun(reviewSessionId: string) {
    return this.readRepository.findActiveRevisionRun(reviewSessionId);
  }

  createRevisionRun(params: {
    topicId: string;
    reviewSessionId: string;
    fromDraftVersionId: string;
    actorId: string;
    items: Array<{ sectionKey: string; instructionMd: string; sourceCommentIds?: string[] }>;
  }) {
    return this.writeRepository.createRevisionRun(params);
  }

  getDraftById(draftVersionId: string) {
    return this.readRepository.getDraftById(draftVersionId);
  }

  updateRevisedSection(params: {
    toDraftVersionId: string;
    sectionKey: string;
    revisedMarkdown: string;
    model?: string;
    promptHash?: string;
  }) {
    return this.writeRepository.updateRevisedSection(params);
  }

  createSectionDiff(data: Prisma.SectionDiffCreateInput) {
    return this.writeRepository.createSectionDiff(data);
  }

  finalizeRevisionRun(revisionRunId: string) {
    return this.writeRepository.finalizeRevisionRun(revisionRunId);
  }

  updateRevisionItemStatus(revisionItemId: string, status: RevisionRunStatus, error?: string) {
    return this.writeRepository.updateRevisionItemStatus(revisionItemId, status, error);
  }

  markRevisionRunFailed(revisionRunId: string, error: string) {
    return this.writeRepository.markRevisionRunFailed(revisionRunId, error);
  }

  createUsageLog(data: Prisma.LlmUsageLogCreateInput) {
    return this.writeRepository.createUsageLog(data);
  }

  getDiffByVersions(topicId: string, fromVersion: number, toVersion: number) {
    return this.readRepository.getDiffByVersions(topicId, fromVersion, toVersion);
  }
}
