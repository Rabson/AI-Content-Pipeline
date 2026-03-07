import { BadRequestException } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { TopicIntakeCommandService } from '../services/topic-intake-command.service';
import { TopicReviewCommandService } from '../services/topic-review-command.service';

const workflowServiceMock = () => ({
  ensureContentItemForTopic: vi.fn(),
  recordEvent: vi.fn(),
  syncTopicStatus: vi.fn(),
});

describe('Topic command services', () => {
  it('creates a topic and stores normalized tags', async () => {
    const topicRepository = {
      create: vi.fn().mockResolvedValue({ id: 'topic-1', title: 'AI Content Pipeline' }),
    } as any;

    const service = new TopicIntakeCommandService(
      topicRepository,
      {} as any,
      {} as any,
      workflowServiceMock() as any,
    );

    await service.createTopic(
      {
        title: 'AI Content Pipeline',
        brief: 'A system design topic',
        audience: 'engineering',
        tags: ['AI', ' Content ', 'PIPELINE'],
      },
      'user-1',
    );

    expect(topicRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'AI Content Pipeline',
        createdBy: 'user-1',
        tags: {
          createMany: {
            data: [{ tag: 'ai' }, { tag: 'content' }, { tag: 'pipeline' }],
            skipDuplicates: true,
          },
        },
      }),
    );
  });

  it('enforces valid status transitions when scoring a topic', async () => {
    const topicQueryService = {
      getTopic: vi.fn().mockResolvedValue({
        id: 'topic-1',
        status: TopicStatus.APPROVED,
      }),
    } as any;

    const statusMachine = {
      assertTransition: vi.fn(() => {
        throw new BadRequestException('invalid');
      }),
    } as any;

    const service = new TopicReviewCommandService(
      {} as any,
      topicQueryService,
      {} as any,
      statusMachine,
      {} as any,
      workflowServiceMock() as any,
    );

    await expect(service.scoreTopic('topic-1', {} as any, 'reviewer-1')).rejects.toThrow('invalid');
    expect(statusMachine.assertTransition).toHaveBeenCalledWith(
      TopicStatus.APPROVED,
      TopicStatus.SCORED,
    );
  });

  it('does not enqueue research twice for a topic already in research flow', async () => {
    const topic = {
      id: 'topic-1',
      title: 'AI Content Pipeline',
      status: TopicStatus.RESEARCH_QUEUED,
    };
    const topicQueryService = {
      getTopic: vi.fn().mockResolvedValue(topic),
    } as any;
    const queueService = {
      enqueueResearch: vi.fn(),
    } as any;

    const service = new TopicReviewCommandService(
      {} as any,
      topicQueryService,
      {} as any,
      { assertTransition: vi.fn() } as any,
      queueService,
      workflowServiceMock() as any,
    );

    const result = await service.handoffToResearch('topic-1', 'editor-1');

    expect(result).toEqual(topic);
    expect(queueService.enqueueResearch).not.toHaveBeenCalled();
  });
});
