import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  CONTENT_PIPELINE_QUEUE,
  REVISION_APPLY_FINALIZE_JOB,
  REVISION_APPLY_SECTION_JOB,
  REVISION_APPLY_START_JOB,
} from './constants/revision.constants';
import { GetDiffQueryDto } from './dto/get-diff-query.dto';
import { RunRevisionDto } from './dto/run-revision.dto';
import { mapRevisionRun } from './mappers/revision.mapper';
import { RevisionRepository } from './revision.repository';
import { WorkflowService } from '../workflow/workflow.service';
import { ContentState, WorkflowEventType, WorkflowStage } from '@prisma/client';

@Injectable()
export class RevisionService {
  constructor(
    private readonly repository: RevisionRepository,
    private readonly workflowService: WorkflowService,
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue,
  ) {}

  async enqueueRevision(reviewSessionId: string, dto: RunRevisionDto, actorId: string) {
    const reviewSession = await this.getReviewSession(reviewSessionId);
    const activeRun = await this.repository.findActiveRevisionRun(reviewSessionId);
    if (activeRun) {
      return this.idempotentResponse(activeRun.id, activeRun.toDraftVersionId);
    }

    const created = await this.repository.createRevisionRun({
      topicId: reviewSession.topicId,
      reviewSessionId,
      fromDraftVersionId: reviewSession.draftVersionId,
      actorId,
      items: dto.items,
    });

    await this.syncRevisionState(reviewSessionId, reviewSession.topicId, created.revisionRun.id, created.toDraft.id, actorId);
    await this.enqueueRevisionJobs(reviewSession, created.revisionRun.id, created.toDraft.id, created.revisionRun.items);

    return this.enqueueResponse(created.revisionRun.id, created.toDraft.id);
  }

  async getRevisionRun(revisionRunId: string) {
    const run = await this.repository.findRevisionRun(revisionRunId);
    if (!run) {
      throw new NotFoundException('Revision run not found');
    }

    return mapRevisionRun(run);
  }

  async getRevisionDiff(revisionRunId: string) {
    const run = await this.repository.findRevisionRun(revisionRunId);
    if (!run) {
      throw new NotFoundException('Revision run not found');
    }

    return {
      revisionRunId,
      sectionDiffs: run.sectionDiffs,
    };
  }

  listRevisionRuns(topicId: string) {
    return this.repository.listRevisionRuns(topicId);
  }

  async compareDraftVersions(topicId: string, query: GetDiffQueryDto) {
    if (!query.fromVersion || !query.toVersion) {
      return { sectionDiffs: [] };
    }

    const diffs = await this.repository.getDiffByVersions(topicId, query.fromVersion, query.toVersion);
    return { sectionDiffs: diffs };
  }

  private async getReviewSession(reviewSessionId: string) {
    const reviewSession = await this.repository.findReviewSession(reviewSessionId);
    if (!reviewSession) {
      throw new NotFoundException('Review session not found');
    }

    return reviewSession;
  }

  private idempotentResponse(revisionRunId: string, toDraftVersionId: string | null) {
    return {
      enqueued: true,
      revisionRunId,
      toDraftVersionId,
      idempotent: true,
    };
  }

  private enqueueResponse(revisionRunId: string, toDraftVersionId: string) {
    return {
      enqueued: true,
      revisionRunId,
      toDraftVersionId,
    };
  }

  private async syncRevisionState(
    reviewSessionId: string,
    topicId: string,
    revisionRunId: string,
    toDraftVersionId: string,
    actorId: string,
  ) {
    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.REVISION,
      toState: ContentState.REVISION_IN_PROGRESS,
      actorId,
      metadata: { reviewSessionId, revisionRunId, toDraftVersionId },
      eventType: WorkflowEventType.REVISION_REQUESTED,
    });
  }

  private async enqueueRevisionJobs(
    reviewSession: NonNullable<Awaited<ReturnType<RevisionRepository['findReviewSession']>>>,
    revisionRunId: string,
    toDraftVersionId: string,
    items: Array<{ id: string; sectionKey: string; instructionMd: string }>,
  ) {
    await this.contentPipelineQueue.add(
      REVISION_APPLY_START_JOB,
      {
        topicId: reviewSession.topicId,
        revisionRunId,
        fromDraftVersionId: reviewSession.draftVersionId,
        toDraftVersionId,
      },
      {
        jobId: `revision:start:${reviewSession.topicId}:${revisionRunId}`,
      },
    );

    for (const item of items) {
      await this.enqueueSectionJob(reviewSession, revisionRunId, toDraftVersionId, item);
    }

    await this.contentPipelineQueue.add(
      REVISION_APPLY_FINALIZE_JOB,
      { revisionRunId },
      { jobId: `revision:finalize:${reviewSession.topicId}:${revisionRunId}` },
    );
  }

  private async enqueueSectionJob(
    reviewSession: NonNullable<Awaited<ReturnType<RevisionRepository['findReviewSession']>>>,
    revisionRunId: string,
    toDraftVersionId: string,
    item: { id: string; sectionKey: string; instructionMd: string },
  ) {
    const fromSection = reviewSession.draftVersion.sections.find((section) => section.sectionKey === item.sectionKey);
    if (!fromSection) {
      return;
    }

    const commentTexts = reviewSession.comments
      .filter((comment) => comment.sectionKey === item.sectionKey)
      .map((comment) => comment.commentMd);

    await this.contentPipelineQueue.add(
      REVISION_APPLY_SECTION_JOB,
      {
        topicId: reviewSession.topicId,
        topicTitle: reviewSession.topic.title,
        revisionRunId,
        revisionItemId: item.id,
        toDraftVersionId,
        sectionKey: item.sectionKey,
        heading: fromSection.heading,
        currentSectionMarkdown: fromSection.contentMd,
        instructionMd: item.instructionMd,
        commentTexts,
      },
      {
        jobId: `revision:section:${reviewSession.topicId}:${revisionRunId}:${item.sectionKey}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );
  }
}
