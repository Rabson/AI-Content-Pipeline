import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentState, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { Queue } from 'bullmq';
import { env } from '../../../config/env';
import { WorkflowService } from '../../workflow/workflow.service';
import { CONTENT_PIPELINE_QUEUE } from '../constants/draft.constants';
import { GenerateDraftDto } from '../dto/generate-draft.dto';
import { DraftRepository } from '../draft.repository';
import { enqueueDraftJobs } from './draft-job-enqueue.helper';
import { buildDraftPayload, hashDraftPayload } from './draft-payload-builder';

@Injectable()
export class DraftGenerationService {
  constructor(
    private readonly repository: DraftRepository,
    private readonly workflowService: WorkflowService,
    @InjectQueue(CONTENT_PIPELINE_QUEUE) private readonly contentPipelineQueue: Queue,
  ) {}

  async enqueueDraftGeneration(topicId: string, dto: GenerateDraftDto, actorId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) throw new NotFoundException('Topic not found');

    const inProgressDraft = await this.repository.findInProgressDraft(topicId);
    if (inProgressDraft) return { enqueued: true, draftVersionId: inProgressDraft.id, versionNumber: inProgressDraft.versionNumber, idempotent: true };

    const outline = await this.repository.getLatestOutline(topicId);
    if (!outline || !outline.sections.length) throw new NotFoundException('No outline found. Generate outline before draft generation.');

    const payload = buildDraftPayload(topicId, topic, outline.sections, dto);
    const draftVersion = await this.repository.createDraftShell({ topicId, actorId, payload: payload as unknown as Record<string, unknown>, model: env.openAiModelDraft, promptHash: hashDraftPayload(payload as unknown as Record<string, unknown>) });
    await this.syncWorkflowState(topicId, draftVersion.id, draftVersion.versionNumber, actorId);
    await enqueueDraftJobs(this.contentPipelineQueue, topicId, draftVersion.id, draftVersion.versionNumber, payload);
    return { enqueued: true, draftVersionId: draftVersion.id, versionNumber: draftVersion.versionNumber };
  }

  private async syncWorkflowState(topicId: string, draftVersionId: string, versionNumber: number, actorId: string) {
    await this.workflowService.setCurrentDraft(topicId, draftVersionId);
    await this.workflowService.transitionContentState({ topicId, stage: WorkflowStage.DRAFT, toState: ContentState.DRAFT_IN_PROGRESS, actorId, metadata: { draftVersionId, versionNumber }, eventType: WorkflowEventType.ENQUEUED });
  }
}
