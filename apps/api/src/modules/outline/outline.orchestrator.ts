import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentState, WorkflowStage } from '@prisma/client';
import { createHash } from 'crypto';
import { env } from '@api/config/env';
import { WorkflowService } from '../workflow/workflow.service';
import { OutlineRepository } from './outline.repository';
import { OpenAiOutlineClient } from './providers/openai-outline.client';
import { OutlineValidatorService } from './providers/outline-validator.service';

@Injectable()
export class OutlineOrchestrator {
  constructor(
    private readonly repository: OutlineRepository,
    private readonly openAiOutlineClient: OpenAiOutlineClient,
    private readonly validator: OutlineValidatorService,
    private readonly workflowService: WorkflowService,
  ) {}

  async run(topicId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) throw new NotFoundException('Topic not found');

    const research = await this.repository.getLatestResearch(topicId);

    const promptInput = {
      topicTitle: topic.title,
      topicBrief: topic.brief,
      audience: topic.audience,
      researchSummary: research?.summary ?? topic.brief,
      keyPoints: research?.keyPoints?.map((kp) => kp.point) ?? [topic.title],
    };

    const result = await this.openAiOutlineClient.generateOutline(promptInput);
    this.validator.validateOutput(result.output);

    const promptHash = createHash('sha256').update(JSON.stringify(promptInput)).digest('hex');

    const outline = await this.repository.persistGeneratedOutline({
      topicId,
      model: env.openAiModelDraft,
      promptHash,
      payload: result.output,
      outline: result.output,
      usage: result.usage,
    });

    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.OUTLINE,
      toState: ContentState.OUTLINE_READY,
      metadata: { outlineId: outline.id, artifactVersionId: outline.artifactVersionId },
    });

    return outline;
  }
}
