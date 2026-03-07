import { Injectable } from '@nestjs/common';
import { WorkflowEventType, WorkflowStage } from '@prisma/client';
import { createHash } from 'crypto';
import { WorkflowService } from '../workflow/workflow.service';
import { SocialGeneratorService } from './providers/social-generator.service';
import { SocialRepository } from './social.repository';

@Injectable()
export class SocialOrchestrator {
  constructor(
    private readonly repository: SocialRepository,
    private readonly generator: SocialGeneratorService,
    private readonly workflowService: WorkflowService,
  ) {}

  async runLinkedIn(topicId: string) {
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const draft = await this.repository.getLatestDraft(topicId);
    const promptInput = {
      topicTitle: topic.title,
      topicBrief: topic.brief,
      markdown: draft?.assembledMarkdown,
    };

    const generated = await this.generator.generateLinkedIn(promptInput);
    const promptHash = createHash('sha256').update(JSON.stringify(promptInput)).digest('hex');

    const post = await this.repository.persistGeneratedLinkedInDraft({
      topicId,
      payload: generated.output,
      model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
      promptHash,
      usage: generated.usage,
    });

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.SOCIAL,
      eventType: WorkflowEventType.SOCIAL_GENERATED,
      metadata: { socialPostId: post.id, versionNumber: post.latestVersionNumber },
    });

    return this.repository.toView(post);
  }
}
