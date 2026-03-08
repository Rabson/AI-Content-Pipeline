import { Queue } from 'bullmq';
import { buildQueueJobId } from '../../../common/queue/job-id.util';
import { DRAFT_GENERATE_FINALIZE_JOB, DRAFT_GENERATE_SECTION_JOB, DRAFT_GENERATE_START_JOB } from '../constants/draft.constants';
import { DraftPayload, DraftSectionPlanItem } from './draft-generation.types';

export async function enqueueDraftJobs(
  queue: Queue,
  topicId: string,
  draftVersionId: string,
  versionNumber: number,
  payload: DraftPayload,
) {
  await queue.add(DRAFT_GENERATE_START_JOB, { topicId, draftVersionId, styleProfile: payload.styleProfile }, { jobId: buildQueueJobId('draft', 'start', topicId, `v${versionNumber}`) });
  for (let index = 0; index < payload.sectionPlan.length; index += 1) {
    await enqueueSectionJob(queue, topicId, draftVersionId, versionNumber, payload.styleProfile, payload.sectionPlan, payload.sectionPlan[index], index);
  }
  await queue.add(DRAFT_GENERATE_FINALIZE_JOB, { topicId, draftVersionId }, { jobId: buildQueueJobId('draft', 'finalize', topicId, `v${versionNumber}`) });
}

function enqueueSectionJob(
  queue: Queue,
  topicId: string,
  draftVersionId: string,
  versionNumber: number,
  styleProfile: string,
  sectionPlan: DraftSectionPlanItem[],
  current: DraftSectionPlanItem,
  index: number,
) {
  return queue.add(
    DRAFT_GENERATE_SECTION_JOB,
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
    { jobId: buildQueueJobId('draft', 'section', topicId, `v${versionNumber}`, current.sectionKey), attempts: 3, backoff: { type: 'exponential', delay: 30000 } },
  );
}
