import { Injectable } from '@nestjs/common';
import { Prisma, WorkflowStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { lockForPublish, markApprovedDraft, markCurrentDraft, updateContentItem } from './workflow-content-item.helper';
import { createEvent, listTopicEvents, setStateAndEvent } from './workflow-event.helper';
import { completeRun, createRun, failRun, latestRun, listTopicRuns, updateRun } from './workflow-run.helper';
import { ensureContentItemForTopic, findTopic } from './workflow-topic.helper';

@Injectable()
export class WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopic(topicId: string) { return findTopic(this.prisma, topicId); }
  ensureContentItemForTopic(topicId: string) { return ensureContentItemForTopic(this.prisma, topicId); }
  createEvent(data: Prisma.WorkflowEventUncheckedCreateInput) { return createEvent(this.prisma, data); }
  createRun(data: Prisma.WorkflowRunUncheckedCreateInput) { return createRun(this.prisma, data); }
  updateRun(runId: string, data: Prisma.WorkflowRunUncheckedUpdateInput) { return updateRun(this.prisma, runId, data); }
  updateContentItem(contentItemId: string, data: Prisma.ContentItemUncheckedUpdateInput) {
    return updateContentItem(this.prisma, contentItemId, data);
  }
  setStateAndEvent(params: Parameters<typeof setStateAndEvent>[1]) { return setStateAndEvent(this.prisma, params); }
  latestRun(contentItemId: string, stage: WorkflowStage) { return latestRun(this.prisma, contentItemId, stage); }
  listTopicEvents(topicId: string) { return listTopicEvents(this.prisma, topicId); }
  listTopicRuns(topicId: string) { return listTopicRuns(this.prisma, topicId); }
  markApprovedDraft(contentItemId: string, draftVersionId: string) { return markApprovedDraft(this.prisma, contentItemId, draftVersionId); }
  markCurrentDraft(contentItemId: string, draftVersionId: string) { return markCurrentDraft(this.prisma, contentItemId, draftVersionId); }
  lockForPublish(contentItemId: string, draftVersionId: string, locked: boolean) {
    return lockForPublish(this.prisma, contentItemId, draftVersionId, locked);
  }
  completeRun(runId: string, metadata?: Prisma.InputJsonValue) { return completeRun(this.prisma, runId, metadata); }
  failRun(runId: string, metadata?: Prisma.InputJsonValue) { return failRun(this.prisma, runId, metadata); }
}
