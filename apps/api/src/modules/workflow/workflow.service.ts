import { Injectable } from '@nestjs/common';
import { ContentState, Prisma, TopicStatus } from '@prisma/client';
import { lockDraftForPublish, markApprovedDraft, setCurrentDraft } from './workflow-draft.helper';
import { syncTopicStatus, transitionContentState } from './workflow-content-command.helper';
import { WorkflowRepository } from './workflow.repository';
import { recordWorkflowEvent, startWorkflowRun } from './workflow-run-event.helper';
import type { RecordWorkflowEventParams, StartWorkflowRunParams, SyncTopicStatusParams, TransitionContentStateParams } from './workflow.service.types';
import { WorkflowTransitionService } from './workflow-transition.service';

@Injectable()
export class WorkflowService {
  constructor(private readonly repository: WorkflowRepository, private readonly transitionService: WorkflowTransitionService) {}

  canTopicTransition(from: TopicStatus, to: TopicStatus) { return this.transitionService.canTopicTransition(from, to); }
  assertTopicTransition(from: TopicStatus, to: TopicStatus) { this.transitionService.assertTopicTransition(from, to); }
  canContentTransition(from: ContentState, to: ContentState) { return this.transitionService.canContentTransition(from, to); }
  assertContentTransition(from: ContentState, to: ContentState) { this.transitionService.assertContentTransition(from, to); }
  topicTransitions() { return this.transitionService.topicTransitions(); }
  ensureContentItemForTopic(topicId: string) { return this.repository.ensureContentItemForTopic(topicId); }
  syncTopicStatus(params: SyncTopicStatusParams) { return syncTopicStatus(this.repository, this.transitionService, params); }
  transitionContentState(params: TransitionContentStateParams) { return transitionContentState(this.repository, this.transitionService, params); }
  recordEvent(params: RecordWorkflowEventParams) { return recordWorkflowEvent(this.repository, params); }
  startRun(params: StartWorkflowRunParams) { return startWorkflowRun(this.repository, params); }
  completeRun(runId: string, metadata?: Prisma.InputJsonValue) { return this.repository.completeRun(runId, metadata); }
  failRun(runId: string, metadata?: Prisma.InputJsonValue) { return this.repository.failRun(runId, metadata); }
  setCurrentDraft(topicId: string, draftVersionId: string) { return setCurrentDraft(this.repository, topicId, draftVersionId); }
  markApprovedDraft(topicId: string, draftVersionId: string, actorId?: string) {
    return markApprovedDraft(this.repository, this, topicId, draftVersionId, actorId);
  }
  lockForPublish(topicId: string, draftVersionId: string, locked: boolean) {
    return lockDraftForPublish(this.repository, topicId, draftVersionId, locked);
  }
  listTopicEvents(topicId: string) { return this.repository.listTopicEvents(topicId); }
  listTopicRuns(topicId: string) { return this.repository.listTopicRuns(topicId); }
}
