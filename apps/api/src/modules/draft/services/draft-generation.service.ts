import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentState, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { WorkflowService } from '../../workflow/workflow.service';
import {
  CONTENT_PIPELINE_QUEUE,
  DRAFT_GENERATE_FINALIZE_JOB,
  DRAFT_GENERATE_SECTION_JOB,
  DRAFT_GENERATE_START_JOB,
} from '../constants/draft.constants';
import { GenerateDraftDto } from '../dto/generate-draft.dto';
import { DraftRepository } from '../draft.repository';

interface DraftSectionPlanItem {
  sectionKey: string;
  heading: string;
  position: number;
  objective: string;
  targetWords: number | null;
  researchSummary: string;
  keyPoints: string[];
}

interface DraftPayload {
  topicId: string;
  styleProfile: string;
  traceId?: string;
  sectionPlan: DraftSectionPlanItem[];
}

@Injectable()
export class DraftGenerationService {
  constructor(
    private readonly repository: DraftRepository,
    private readonly workflowService: WorkflowService,
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue,
  ) {}

  async enqueueDraftGeneration(topicId: string, dto: GenerateDraftDto, actorId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const inProgressDraft = await this.repository.findInProgressDraft(topicId);
    if (inProgressDraft) {
      return this.toIdempotentResult(inProgressDraft.id, inProgressDraft.versionNumber);
    }

    const outline = await this.repository.getLatestOutline(topicId);
    if (!outline || !outline.sections.length) {
      throw new NotFoundException('No outline found. Generate outline before draft generation.');
    }

    const payload = this.buildDraftPayload(topicId, topic, outline.sections, dto);
    const draftVersion = await this.repository.createDraftShell({
      topicId,
      actorId,
      payload: payload as unknown as Record<string, unknown>,
      model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
      promptHash: this.hashPayload(payload as unknown as Record<string, unknown>),
    });

    await this.syncWorkflowState(topicId, draftVersion.id, draftVersion.versionNumber, actorId);
    await this.enqueueJobs(topicId, draftVersion.id, draftVersion.versionNumber, payload);

    return {
      enqueued: true,
      draftVersionId: draftVersion.id,
      versionNumber: draftVersion.versionNumber,
    };
  }

  private buildDraftPayload(
    topicId: string,
    topic: { brief: string | null; title: string },
    sections: Array<{
      sectionKey: string;
      heading: string;
      position: number;
      objective: string;
      targetWords: number | null;
    }>,
    dto: GenerateDraftDto,
  ): DraftPayload {
    return {
      topicId,
      styleProfile: dto.styleProfile ?? 'technical_pragmatic',
      traceId: dto.traceId,
      sectionPlan: sections.map((section) => ({
        sectionKey: section.sectionKey,
        heading: section.heading,
        position: section.position,
        objective: section.objective,
        targetWords: section.targetWords,
        researchSummary: topic.brief ?? topic.title,
        keyPoints: [topic.title],
      })),
    };
  }

  private hashPayload(payload: Record<string, unknown>) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private toIdempotentResult(draftVersionId: string, versionNumber: number) {
    return {
      enqueued: true,
      draftVersionId,
      versionNumber,
      idempotent: true,
    };
  }

  private async syncWorkflowState(topicId: string, draftVersionId: string, versionNumber: number, actorId: string) {
    await this.workflowService.setCurrentDraft(topicId, draftVersionId);
    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.DRAFT,
      toState: ContentState.DRAFT_IN_PROGRESS,
      actorId,
      metadata: { draftVersionId, versionNumber },
      eventType: WorkflowEventType.ENQUEUED,
    });
  }

  private async enqueueJobs(
    topicId: string,
    draftVersionId: string,
    versionNumber: number,
    payload: DraftPayload,
  ) {
    await this.contentPipelineQueue.add(
      DRAFT_GENERATE_START_JOB,
      {
        topicId,
        draftVersionId,
        styleProfile: payload.styleProfile,
      },
      { jobId: `draft:start:${topicId}:v${versionNumber}` },
    );

    for (let index = 0; index < payload.sectionPlan.length; index += 1) {
      const current = payload.sectionPlan[index];
      await this.enqueueSectionJob(topicId, draftVersionId, versionNumber, payload.styleProfile, payload.sectionPlan, current, index);
    }

    await this.contentPipelineQueue.add(
      DRAFT_GENERATE_FINALIZE_JOB,
      { topicId, draftVersionId },
      { jobId: `draft:finalize:${topicId}:v${versionNumber}` },
    );
  }

  private enqueueSectionJob(
    topicId: string,
    draftVersionId: string,
    versionNumber: number,
    styleProfile: string,
    sectionPlan: DraftSectionPlanItem[],
    current: DraftSectionPlanItem,
    index: number,
  ) {
    return this.contentPipelineQueue.add(
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
      {
        jobId: `draft:section:${topicId}:v${versionNumber}:${current.sectionKey}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );
  }
}
