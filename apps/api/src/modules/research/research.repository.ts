import { Injectable, NotFoundException } from '@nestjs/common';
import { SourceType, TopicStatus } from '@prisma/client';
import { ResearchReadRepository } from './repositories/research-read.repository';
import { ResearchWriteRepository } from './repositories/research-write.repository';

@Injectable()
export class ResearchRepository {
  constructor(
    private readonly readRepository: ResearchReadRepository,
    private readonly writeRepository: ResearchWriteRepository,
  ) {}

  findTopicById(topicId: string) {
    return this.readRepository.findTopicById(topicId);
  }

  getNextVersion(topicId: string) {
    return this.readRepository.getNextVersion(topicId);
  }

  latestResearchByTopic(topicId: string) {
    return this.readRepository.latestResearchByTopic(topicId);
  }

  researchVersions(topicId: string) {
    return this.readRepository.researchVersions(topicId);
  }

  markTopicStatus(topicId: string, status: TopicStatus) {
    return this.writeRepository.markTopicStatus(topicId, status);
  }

  async addManualSource(
    topicId: string,
    data: {
      url: string;
      domain?: string | null;
      title?: string;
      excerpt?: string;
      sourceType: SourceType;
    },
  ) {
    const latest = await this.latestResearchByTopic(topicId);
    if (!latest) {
      throw new NotFoundException('No research artifact exists yet');
    }

    return this.writeRepository.addManualSource(topicId, latest.id, data);
  }

  async persistResearchResult(params: {
    topicId: string;
    model: string;
    promptHash: string;
    payload: Record<string, unknown>;
    output: {
      summary: string;
      confidenceScore: number;
      sources: Array<{
        id: string;
        url: string;
        title: string;
        credibilityScore: number;
      }>;
      keyPoints: Array<{
        point: string;
        importance: string;
        sourceIds: string[];
      }>;
      examples: Array<{
        title: string;
        description: string;
        takeaway: string;
        sourceIds: string[];
      }>;
    };
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    traceId: string;
  }) {
    const [versionNumber, topic] = await Promise.all([
      this.getNextVersion(params.topicId),
      this.findTopicById(params.topicId),
    ]);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.writeRepository.persistResearchResult({
      ...params,
      contentItemId: topic.contentItemId ?? undefined,
      versionNumber,
    });
  }

  persistFailedExecution(topicId: string, payload: Record<string, unknown>, error: string) {
    return this.writeRepository.persistFailedExecution(topicId, payload, error);
  }
}
