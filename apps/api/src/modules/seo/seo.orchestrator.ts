import { Injectable } from '@nestjs/common';
import { WorkflowEventType, WorkflowStage } from '@prisma/client';
import { createHash } from 'crypto';
import { WorkflowService } from '../workflow/workflow.service';
import { SeoRepository } from './seo.repository';
import { SeoGeneratorService } from './providers/seo-generator.service';

@Injectable()
export class SeoOrchestrator {
  constructor(
    private readonly repository: SeoRepository,
    private readonly generator: SeoGeneratorService,
    private readonly workflowService: WorkflowService,
  ) {}

  async run(topicId: string) {
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

    const generated = await this.generator.generate(promptInput);
    const promptHash = createHash('sha256').update(JSON.stringify(promptInput)).digest('hex');

    const seo = await this.repository.persistGeneratedSeo({
      topicId,
      payload: generated.output,
      model: process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini',
      promptHash,
      usage: generated.usage,
    });

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.SEO,
      eventType: WorkflowEventType.SEO_GENERATED,
      metadata: { seoMetadataId: seo.id, slug: seo.slug },
    });

    return seo;
  }
}
