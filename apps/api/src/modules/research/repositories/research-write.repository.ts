import { Injectable } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { persistFailedExecution } from './research-failure-write.helper';
import { markTopicStatus, persistResearchResult } from './research-result-write.helper';
import { addManualSource } from './research-source-write.helper';
import type { ManualSourceInput, PersistResearchResultParams } from './research-write.types';

@Injectable()
export class ResearchWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  markTopicStatus(topicId: string, status: TopicStatus) { return markTopicStatus(this.prisma, topicId, status); }
  addManualSource(topicId: string, latestResearchId: string, data: ManualSourceInput) {
    void topicId;
    return addManualSource(this.prisma, latestResearchId, data);
  }
  persistResearchResult(params: PersistResearchResultParams) { return persistResearchResult(this.prisma, params); }
  persistFailedExecution(topicId: string, payload: Record<string, unknown>, error: string) {
    return persistFailedExecution(this.prisma, topicId, payload, error);
  }
}
