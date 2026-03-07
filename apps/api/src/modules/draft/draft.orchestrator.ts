import { Injectable } from '@nestjs/common';
import { ContentState, WorkflowStage } from '@prisma/client';
import { createHash } from 'crypto';
import { WorkflowService } from '../workflow/workflow.service';
import { DraftRepository } from './draft.repository';
import { DraftValidatorService } from './providers/draft-validator.service';
import { OpenAiDraftClient } from './providers/openai-draft.client';

export interface DraftSectionJobPayload {
  topicId: string;
  draftVersionId: string;
  sectionKey: string;
  heading: string;
  position: number;
  objective: string;
  previousHeading?: string;
  nextHeading?: string;
  researchSummary: string;
  keyPoints: string[];
  styleProfile?: string;
}

@Injectable()
export class DraftOrchestrator {
  constructor(
    private readonly repository: DraftRepository,
    private readonly validator: DraftValidatorService,
    private readonly openAiClient: OpenAiDraftClient,
    private readonly workflowService: WorkflowService,
  ) {}

  async processSection(payload: DraftSectionJobPayload) {
    const topic = await this.repository.findTopicById(payload.topicId);
    if (!topic) {
      throw new Error('Topic not found for draft section generation');
    }

    const promptInput = {
      topicTitle: topic.title,
      audience: topic.audience,
      sectionKey: payload.sectionKey,
      heading: payload.heading,
      objective: payload.objective,
      previousHeading: payload.previousHeading,
      nextHeading: payload.nextHeading,
      researchSummary: payload.researchSummary,
      keyPoints: payload.keyPoints,
      styleProfile: payload.styleProfile,
    };

    const promptHash = createHash('sha256').update(JSON.stringify(promptInput)).digest('hex');

    const generated = await this.openAiClient.generateSectionMarkdown(promptInput);
    this.validator.validateMarkdown(generated.markdown);

    await this.repository.upsertDraftSection({
      draftVersionId: payload.draftVersionId,
      sectionKey: payload.sectionKey,
      heading: payload.heading,
      position: payload.position,
      contentMd: generated.markdown,
      model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
      promptHash,
    });

    if (generated.usage) {
      await this.repository.createUsageLog({
        topic: { connect: { id: payload.topicId } },
        module: 'draft.section',
        model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
        promptTokens: generated.usage.prompt_tokens,
        completionTokens: generated.usage.completion_tokens,
        totalTokens: generated.usage.total_tokens,
      });
    }

    return { sectionKey: payload.sectionKey, status: 'generated' };
  }

  async finalizeDraft(draftVersionId: string) {
    const draft = await this.repository.finalizeDraft(draftVersionId);
    await this.workflowService.setCurrentDraft(draft.topicId, draft.id);
    await this.workflowService.transitionContentState({
      topicId: draft.topicId,
      stage: WorkflowStage.DRAFT,
      toState: ContentState.DRAFT_READY,
      metadata: { draftVersionId: draft.id, versionNumber: draft.versionNumber },
    });
    return draft;
  }
}
