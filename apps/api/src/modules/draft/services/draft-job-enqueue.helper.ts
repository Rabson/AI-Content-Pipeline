import { Queue } from 'bullmq';
import type {
  DraftGenerateFinalizeJobPayload,
  DraftGenerateSectionJobPayload,
  DraftGenerateStartJobPayload,
} from '@aicp/queue-contracts';
import { withQueueContractEnvelope } from '@aicp/queue-contracts';
import { buildQueueJobId } from '@api/common/queue/job-id.util';
import { resolveQueueTraceMetadata } from '@api/common/queue/trace-metadata.util';
import { DRAFT_GENERATE_FINALIZE_JOB, DRAFT_GENERATE_SECTION_JOB, DRAFT_GENERATE_START_JOB } from '../constants/draft.constants';
import { DraftPayload, DraftSectionPlanItem } from './draft-generation.types';

export async function enqueueDraftJobs(
  queue: Queue<DraftGenerateStartJobPayload | DraftGenerateSectionJobPayload | DraftGenerateFinalizeJobPayload>,
  topicId: string,
  draftVersionId: string,
  versionNumber: number,
  payload: DraftPayload,
) {
  const trace = resolveQueueTraceMetadata({ traceId: payload.traceId });
  const startJobId = buildQueueJobId('draft', 'start', topicId, `v${versionNumber}`);
  await queue.add(
    DRAFT_GENERATE_START_JOB,
    withQueueContractEnvelope(
      { topicId, draftVersionId, styleProfile: payload.styleProfile },
      { idempotencyKey: startJobId, ...trace },
    ),
    { jobId: startJobId },
  );
  for (let index = 0; index < payload.sectionPlan.length; index += 1) {
    await enqueueSectionJob(queue, topicId, draftVersionId, versionNumber, payload.styleProfile, payload.sectionPlan, payload.sectionPlan[index], index, trace);
  }
  const finalizeJobId = buildQueueJobId('draft', 'finalize', topicId, `v${versionNumber}`);
  await queue.add(
    DRAFT_GENERATE_FINALIZE_JOB,
    withQueueContractEnvelope({ topicId, draftVersionId }, { idempotencyKey: finalizeJobId, ...trace }),
    { jobId: finalizeJobId },
  );
}

function enqueueSectionJob(
  queue: Queue<DraftGenerateStartJobPayload | DraftGenerateSectionJobPayload | DraftGenerateFinalizeJobPayload>,
  topicId: string,
  draftVersionId: string,
  versionNumber: number,
  styleProfile: string,
  sectionPlan: DraftSectionPlanItem[],
  current: DraftSectionPlanItem,
  index: number,
  trace: { traceId: string; requestId: string },
) {
  const sectionJobId = buildQueueJobId('draft', 'section', topicId, `v${versionNumber}`, current.sectionKey);
  return queue.add(
    DRAFT_GENERATE_SECTION_JOB,
    withQueueContractEnvelope(
      {
        topicId,
        draftVersionId,
        sectionKey: current.sectionKey,
        heading: current.heading,
        position: current.position,
        objective: current.objective,
        previousHeading: index > 0 ? sectionPlan[index - 1].heading : undefined,
        nextHeading: index < sectionPlan.length - 1 ? sectionPlan[index + 1].heading : undefined,
        researchSummary: current.researchSummary,
        keyPoints: current.keyPoints,
        styleProfile,
        targetWords: current.targetWords,
      },
      { idempotencyKey: sectionJobId, ...trace },
    ),
    { jobId: sectionJobId, attempts: 3, backoff: { type: 'exponential', delay: 30000 } },
  );
}
