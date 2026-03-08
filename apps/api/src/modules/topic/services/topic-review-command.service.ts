import { BadRequestException, Injectable } from '@nestjs/common';
import { TopicStatus, WorkflowEventType, WorkflowStage } from '@prisma/client';
import { randomUUID } from 'crypto';
import { WorkflowService } from '../../workflow/workflow.service';
import { UserTopicOwnershipService } from '../../user/services/user-topic-ownership.service';
import { ApproveTopicDto } from '../dto/approve-topic.dto';
import { RejectTopicDto } from '../dto/reject-topic.dto';
import { ScoreTopicDto } from '../dto/score-topic.dto';
import { TopicQueueService } from '../topic.queue.service';
import { TopicRepository } from '../topic.repository';
import { TopicScoringService } from '../topic.scoring.service';
import { TopicStatusMachine } from '../topic.status-machine';
import { TopicQueryService } from './topic-query.service';

@Injectable()
export class TopicReviewCommandService {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly topicQueryService: TopicQueryService,
    private readonly scoringService: TopicScoringService,
    private readonly statusMachine: TopicStatusMachine,
    private readonly queueService: TopicQueueService,
    private readonly workflowService: WorkflowService,
    private readonly ownershipService: UserTopicOwnershipService,
  ) {}

  async scoreTopic(topicId: string, dto: ScoreTopicDto, actorId: string) {
    const topic = await this.topicQueryService.getTopic(topicId);
    this.statusMachine.assertTransition(topic.status, TopicStatus.SCORED);

    const score = this.scoringService.calculate(dto);
    const updated = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: topic.status,
      toStatus: TopicStatus.SCORED,
      actorId,
      metadata: { scoreNotes: dto.notes ?? null },
      topicUpdate: {
        scoreTotal: score.total,
        scoreBreakdown: score.breakdown,
      },
    });

    await this.workflowService.recordEvent({
      topicId,
      stage: WorkflowStage.TOPIC,
      eventType: WorkflowEventType.TOPIC_SCORED,
      actorId,
      metadata: { total: score.total, breakdown: score.breakdown },
    });

    return (await this.ownershipService.assignDefaultOwner(topicId)) ?? updated;
  }

  async approveTopic(topicId: string, dto: ApproveTopicDto, actorId: string) {
    const topic = await this.topicQueryService.getTopic(topicId);
    if (topic.status === TopicStatus.SUBMITTED) {
      throw new BadRequestException('Topic must be scored before approval');
    }

    this.statusMachine.assertTransition(topic.status, TopicStatus.APPROVED);
    const updated = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: topic.status,
      toStatus: TopicStatus.APPROVED,
      actorId,
      reason: dto.note,
      topicUpdate: {
        approvedBy: actorId,
        approvedAt: new Date(),
        approvalNote: dto.note,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await this.workflowService.syncTopicStatus({
      topicId,
      topicStatus: TopicStatus.APPROVED,
      stage: WorkflowStage.TOPIC,
      actorId,
      eventType: WorkflowEventType.TOPIC_APPROVED,
      metadata: { note: dto.note ?? null },
    });

    return updated;
  }

  async rejectTopic(topicId: string, dto: RejectTopicDto, actorId: string) {
    const topic = await this.topicQueryService.getTopic(topicId);
    this.statusMachine.assertTransition(topic.status, TopicStatus.REJECTED);

    const updated = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: topic.status,
      toStatus: TopicStatus.REJECTED,
      actorId,
      reason: dto.reason,
      topicUpdate: {
        rejectedBy: actorId,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    await this.workflowService.syncTopicStatus({
      topicId,
      topicStatus: TopicStatus.REJECTED,
      stage: WorkflowStage.TOPIC,
      actorId,
      eventType: WorkflowEventType.TOPIC_REJECTED,
      metadata: { reason: dto.reason },
    });

    return updated;
  }

  async handoffToResearch(topicId: string, actorId: string, traceId?: string) {
    const topic = await this.topicQueryService.getTopic(topicId);
    if (topic.status === TopicStatus.RESEARCH_QUEUED || topic.status === TopicStatus.RESEARCH_IN_PROGRESS) {
      return topic;
    }

    this.statusMachine.assertTransition(topic.status, TopicStatus.RESEARCH_QUEUED);
    const jobTraceId = traceId ?? randomUUID();
    const jobId = await this.queueService.enqueueResearch({
      topicId: topic.id,
      contentItemId: topic.contentItemId ?? undefined,
      title: topic.title,
      brief: topic.brief,
      audience: topic.audience,
      enqueuedBy: actorId,
      traceId: jobTraceId,
    });

    const updated = await this.topicRepository.transitionStatus({
      topicId,
      fromStatus: topic.status,
      toStatus: TopicStatus.RESEARCH_QUEUED,
      actorId,
      metadata: { jobId, traceId: jobTraceId },
      topicUpdate: {
        researchJobId: jobId,
        researchEnqueuedAt: new Date(),
      },
    });

    await this.workflowService.syncTopicStatus({
      topicId,
      topicStatus: TopicStatus.RESEARCH_QUEUED,
      stage: WorkflowStage.RESEARCH,
      actorId,
      eventType: WorkflowEventType.ENQUEUED,
      metadata: { jobId, traceId: jobTraceId },
    });

    return updated;
  }
}
