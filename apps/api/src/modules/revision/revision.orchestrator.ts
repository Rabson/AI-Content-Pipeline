import { Injectable } from '@nestjs/common';
import { ContentState, WorkflowStage } from '@prisma/client';
import { createHash } from 'crypto';
import { WorkflowService } from '../workflow/workflow.service';
import { DiffService } from './providers/diff.service';
import { OpenAiRevisionClient } from './providers/openai-revision.client';
import { RevisionRepository } from './revision.repository';

@Injectable()
export class RevisionOrchestrator {
  constructor(
    private readonly repository: RevisionRepository,
    private readonly openAiRevisionClient: OpenAiRevisionClient,
    private readonly diffService: DiffService,
    private readonly workflowService: WorkflowService,
  ) {}

  async processRevisionSection(payload: {
    topicId: string;
    topicTitle: string;
    revisionRunId: string;
    revisionItemId: string;
    toDraftVersionId: string;
    sectionKey: string;
    heading: string;
    currentSectionMarkdown: string;
    instructionMd: string;
    commentTexts: string[];
  }) {
    await this.repository.updateRevisionItemStatus(payload.revisionItemId, 'IN_PROGRESS');

    try {
      const promptInput = this.buildPromptInput(payload);
      const promptHash = createHash('sha256').update(JSON.stringify(promptInput)).digest('hex');
      const revised = await this.openAiRevisionClient.reviseSection(promptInput);
      await this.persistRevisionResult(payload, revised.markdown, promptHash);
      await this.repository.updateRevisionItemStatus(payload.revisionItemId, 'COMPLETED');

      if (revised.usage) {
        await this.repository.createUsageLog({
          topic: { connect: { id: payload.topicId } },
          module: 'revision.section',
          model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
          promptTokens: revised.usage.prompt_tokens,
          completionTokens: revised.usage.completion_tokens,
          totalTokens: revised.usage.total_tokens,
        });
      }

      return { revisionItemId: payload.revisionItemId, status: 'completed' };
    } catch (error) {
      await this.repository.updateRevisionItemStatus(
        payload.revisionItemId,
        'FAILED',
        error instanceof Error ? error.message : 'Unknown revision error',
      );
      throw error;
    }
  }

  async finalizeRevision(revisionRunId: string) {
    const run = await this.repository.finalizeRevisionRun(revisionRunId);
    if (run?.topicId && run.toDraftVersionId) {
      await this.workflowService.setCurrentDraft(run.topicId, run.toDraftVersionId);
      await this.workflowService.transitionContentState({
        topicId: run.topicId,
        stage: WorkflowStage.REVISION,
        toState: ContentState.DRAFT_READY,
        metadata: { revisionRunId, toDraftVersionId: run.toDraftVersionId },
      });
    }

    return run;
  }

  private buildPromptInput(payload: {
    topicTitle: string;
    sectionKey: string;
    heading: string;
    currentSectionMarkdown: string;
    instructionMd: string;
    commentTexts: string[];
  }) {
    return {
      topicTitle: payload.topicTitle,
      sectionKey: payload.sectionKey,
      heading: payload.heading,
      currentSectionMarkdown: payload.currentSectionMarkdown,
      instructionMd: payload.instructionMd,
      commentTexts: payload.commentTexts,
    };
  }

  private async persistRevisionResult(
    payload: {
      revisionRunId: string;
      toDraftVersionId: string;
      sectionKey: string;
      currentSectionMarkdown: string;
    },
    revisedMarkdown: string,
    promptHash: string,
  ) {
    await this.repository.updateRevisedSection({
      toDraftVersionId: payload.toDraftVersionId,
      sectionKey: payload.sectionKey,
      revisedMarkdown,
      model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
      promptHash,
    });

    const updatedSection = await this.getUpdatedSection(payload.toDraftVersionId, payload.sectionKey);
    await this.repository.createSectionDiff({
      revisionRun: { connect: { id: payload.revisionRunId } },
      draftSection: { connect: { id: updatedSection.id } },
      sectionKey: payload.sectionKey,
      beforeMd: payload.currentSectionMarkdown,
      afterMd: revisedMarkdown,
      diffUnifiedMd: this.diffService.buildUnifiedDiff(payload.currentSectionMarkdown, revisedMarkdown),
    });

    return updatedSection;
  }

  private async getUpdatedSection(toDraftVersionId: string, sectionKey: string) {
    const updatedDraft = await this.repository.getDraftById(toDraftVersionId);
    const updatedSection = updatedDraft?.sections.find((section) => section.sectionKey === sectionKey);

    if (!updatedSection) {
      throw new Error('Updated section not found after revision');
    }

    return updatedSection;
  }
}
