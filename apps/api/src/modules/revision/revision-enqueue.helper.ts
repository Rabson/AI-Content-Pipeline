import { NotFoundException } from '@nestjs/common';
import { ContentState, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { Queue } from 'bullmq';
import type {
  RevisionApplyFinalizeJobPayload,
  RevisionApplySectionJobPayload,
  RevisionApplyStartJobPayload,
} from '@aicp/queue-contracts';
import { withQueueContractEnvelope } from '@aicp/queue-contracts';
import { buildQueueJobId } from '@api/common/queue/job-id.util';
import { resolveQueueTraceMetadata } from '@api/common/queue/trace-metadata.util';
import { RevisionRepository } from './revision.repository';
import { REVISION_APPLY_FINALIZE_JOB, REVISION_APPLY_SECTION_JOB, REVISION_APPLY_START_JOB } from './constants/revision.constants';
import { RunRevisionDto } from './dto/run-revision.dto';
import { WorkflowService } from '../workflow/workflow.service';
export async function enqueueRevisionRun(
  repository: RevisionRepository,
  workflowService: WorkflowService,
  queue: Queue<RevisionApplyStartJobPayload | RevisionApplySectionJobPayload | RevisionApplyFinalizeJobPayload>,
  reviewSessionId: string,
  dto: RunRevisionDto,
  actorId: string,
) {
  const reviewSession = await repository.findReviewSession(reviewSessionId);
  if (!reviewSession) throw new NotFoundException('Review session not found');
  const trace = resolveQueueTraceMetadata({ traceId: dto.traceId });

  const activeRun = await repository.findActiveRevisionRun(reviewSessionId);
  if (activeRun) return { enqueued: true, revisionRunId: activeRun.id, toDraftVersionId: activeRun.toDraftVersionId, idempotent: true };

  const created = await repository.createRevisionRun({ topicId: reviewSession.topicId, reviewSessionId, fromDraftVersionId: reviewSession.draftVersionId, actorId, items: dto.items });
  await workflowService.transitionContentState({ topicId: reviewSession.topicId, stage: WorkflowStage.REVISION, toState: ContentState.REVISION_IN_PROGRESS, actorId, metadata: { reviewSessionId, revisionRunId: created.revisionRun.id, toDraftVersionId: created.toDraft.id }, eventType: WorkflowEventType.REVISION_REQUESTED });
  await enqueueRevisionJobs(queue, reviewSession, created.revisionRun.id, created.toDraft.id, created.revisionRun.items, trace);
  return { enqueued: true, revisionRunId: created.revisionRun.id, toDraftVersionId: created.toDraft.id };
}
async function enqueueRevisionJobs(
  queue: Queue<RevisionApplyStartJobPayload | RevisionApplySectionJobPayload | RevisionApplyFinalizeJobPayload>,
  reviewSession: NonNullable<Awaited<ReturnType<RevisionRepository['findReviewSession']>>>,
  revisionRunId: string,
  toDraftVersionId: string,
  items: Array<{ id: string; sectionKey: string; instructionMd: string }>,
  trace: { traceId: string; requestId: string },
) {
  const startJobId = buildQueueJobId('revision', 'start', reviewSession.topicId, revisionRunId);
  await queue.add(
    REVISION_APPLY_START_JOB,
    withQueueContractEnvelope(
      {
        topicId: reviewSession.topicId,
        revisionRunId,
        fromDraftVersionId: reviewSession.draftVersionId,
        toDraftVersionId,
      },
      { idempotencyKey: startJobId, ...trace },
    ),
    { jobId: startJobId },
  );
  for (const item of items) await enqueueRevisionSection(queue, reviewSession, revisionRunId, toDraftVersionId, item, trace);
  const finalizeJobId = buildQueueJobId('revision', 'finalize', reviewSession.topicId, revisionRunId);
  await queue.add(
    REVISION_APPLY_FINALIZE_JOB,
    withQueueContractEnvelope({ revisionRunId }, { idempotencyKey: finalizeJobId, ...trace }),
    { jobId: finalizeJobId },
  );
}
function enqueueRevisionSection(
  queue: Queue<RevisionApplyStartJobPayload | RevisionApplySectionJobPayload | RevisionApplyFinalizeJobPayload>,
  reviewSession: NonNullable<Awaited<ReturnType<RevisionRepository['findReviewSession']>>>,
  revisionRunId: string,
  toDraftVersionId: string,
  item: { id: string; sectionKey: string; instructionMd: string },
  trace: { traceId: string; requestId: string },
) {
  const fromSection = reviewSession.draftVersion.sections.find((section) => section.sectionKey === item.sectionKey);
  if (!fromSection) return;
  const commentTexts = reviewSession.comments.filter((comment) => comment.sectionKey === item.sectionKey).map((comment) => comment.commentMd);
  const sectionJobId = buildQueueJobId('revision', 'section', reviewSession.topicId, revisionRunId, item.sectionKey);
  return queue.add(
    REVISION_APPLY_SECTION_JOB,
    withQueueContractEnvelope(
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
      { idempotencyKey: sectionJobId, ...trace },
    ),
    { jobId: sectionJobId, attempts: 3, backoff: { type: 'exponential', delay: 30000 } },
  );
}
