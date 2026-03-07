import { BadRequestException } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { TopicReviewCommandService } from '../../src/modules/topic/services/topic-review-command.service';
import { WorkflowService } from '../../src/modules/workflow/workflow.service';
import { WorkflowTransitionService } from '../../src/modules/workflow/workflow-transition.service';

describe('Workflow integration', () => {
  it('blocks invalid topic transitions', () => {
    const workflow = new WorkflowService({} as any, new WorkflowTransitionService());
    expect(() => workflow.assertTopicTransition(TopicStatus.DRAFT, TopicStatus.APPROVED)).toThrow(
      BadRequestException,
    );
  });

  it('requires scoring before approval', async () => {
    const topicQueryService = {
      getTopic: vi.fn().mockResolvedValue({
        id: 'topic-1',
        status: TopicStatus.SUBMITTED,
      }),
    } as any;

    const service = new TopicReviewCommandService(
      {} as any,
      topicQueryService,
      {} as any,
      { assertTransition: vi.fn() } as any,
      {} as any,
      {} as any,
    );

    await expect(service.approveTopic('topic-1', { note: 'ship it' }, 'reviewer-1')).rejects.toThrow(
      'Topic must be scored before approval',
    );
  });
});
