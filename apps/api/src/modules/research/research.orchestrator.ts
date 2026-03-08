import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { ContentState, TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { env } from '../../config/env';
import { WorkflowService } from '../workflow/workflow.service';
import { ResearchRepository } from './research.repository';
import { SourceGathererService } from './providers/source-gatherer.service';
import { SourceNormalizerService } from './providers/source-normalizer.service';
import { ResearchValidatorService } from './providers/research-validator.service';
import { OpenAiResearchClient } from './providers/openai-research.client';
import type { ResearchPromptInput } from './prompts/research-synthesis.prompt';

@Injectable()
export class ResearchOrchestrator {
  constructor(
    private readonly repository: ResearchRepository,
    private readonly sourceGatherer: SourceGathererService,
    private readonly sourceNormalizer: SourceNormalizerService,
    private readonly validator: ResearchValidatorService,
    private readonly openAiResearchClient: OpenAiResearchClient,
    private readonly workflowService: WorkflowService,
  ) {}

  async run(topicId: string, traceId?: string) {
    const topic = await this.getEligibleTopic(topicId);
    const resolvedTraceId = traceId ?? randomUUID();
    await this.repository.markTopicStatus(topicId, TopicStatus.RESEARCH_IN_PROGRESS);
    const run = await this.workflowService.startRun({
      topicId,
      stage: WorkflowStage.RESEARCH,
      metadata: { traceId: traceId ?? null },
    });

    try {
      const promptInput = await this.buildPromptInput(topic);
      const aiResult = await this.generateStructuredNotes(promptInput);
      const artifact = await this.repository.persistResearchResult({
        topicId,
        model: env.openAiModelResearch,
        promptHash: this.hashPrompt(promptInput),
        payload: aiResult.output,
        output: aiResult.output,
        usage: aiResult.usage,
        traceId: resolvedTraceId,
      });

      await this.completeResearchRun(topicId, run.id, artifact.id, resolvedTraceId);

      return artifact;
    } catch (error) {
      await this.failResearchRun(topicId, run.id, resolvedTraceId, error);
      throw error;
    }
  }

  private async getEligibleTopic(topicId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.status !== TopicStatus.APPROVED && topic.status !== TopicStatus.RESEARCH_QUEUED) {
      throw new BadRequestException(`Topic ${topicId} is not in a research-eligible state`);
    }

    return topic;
  }

  private async buildPromptInput(topic: {
    title: string;
    brief: string | null;
    audience: string | null;
  }): Promise<ResearchPromptInput> {
    const gathered = await this.sourceGatherer.gatherFromTopic({
      title: topic.title,
      brief: topic.brief,
    });
    const normalizedSources = gathered.map((source) => ({
      ...source,
      url: this.sourceNormalizer.normalizeUrl(source.url),
    }));

    this.validator.validateSources(normalizedSources.length);
    return {
      topicTitle: topic.title,
      topicBrief: topic.brief,
      audience: topic.audience,
      sources: normalizedSources,
    };
  }

  private async generateStructuredNotes(promptInput: ResearchPromptInput) {
    const aiResult = await this.openAiResearchClient.synthesizeStructuredNotes(promptInput);
    this.validator.validateStructuredOutput(aiResult.output);
    return aiResult;
  }

  private hashPrompt(promptInput: unknown) {
    return createHash('sha256').update(JSON.stringify(promptInput)).digest('hex');
  }

  private async completeResearchRun(
    topicId: string,
    runId: string,
    researchArtifactId: string,
    traceId: string,
  ) {
    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.RESEARCH,
      toState: ContentState.RESEARCH_READY,
      metadata: { researchArtifactId, traceId },
      workflowRunId: runId,
      eventType: WorkflowEventType.COMPLETED,
    });
    await this.workflowService.completeRun(runId, { topicId, traceId });
  }

  private async failResearchRun(topicId: string, runId: string, traceId: string, error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown research error';
    await this.repository.persistFailedExecution(topicId, { topicId, traceId }, message);
    await this.workflowService.transitionContentState({
      topicId,
      stage: WorkflowStage.RESEARCH,
      toState: ContentState.FAILED,
      metadata: { traceId, error: message },
      workflowRunId: runId,
      eventType: WorkflowEventType.FAILED,
    });
    await this.workflowService.failRun(runId, {
      topicId,
      traceId,
      error: message,
    });
  }
}
