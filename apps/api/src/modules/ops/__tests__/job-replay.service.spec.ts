import { BadRequestException } from '@nestjs/common';
import { JobExecutionStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { JobReplayService } from '../services/job-replay.service';

function buildService() {
  const queue = {
    getJob: vi.fn(),
    add: vi.fn(),
  };
  const jobExecutionRepository = {
    findExecutionById: vi.fn(),
  };
  const workflowService = {
    recordEvent: vi.fn(),
  };
  const queueRegistry = {
    resolve: vi.fn().mockReturnValue(queue),
  };
  const securityEventService = {
    replayRequested: vi.fn(),
  };

  const service = new JobReplayService(
    jobExecutionRepository as any,
    workflowService as any,
    queueRegistry as any,
    securityEventService as any,
  );

  return { service, queue, jobExecutionRepository, workflowService, queueRegistry, securityEventService };
}

describe('JobReplayService', () => {
  it('rejects replay for non-failed executions', async () => {
    const { service, jobExecutionRepository } = buildService();
    jobExecutionRepository.findExecutionById.mockResolvedValue({
      id: 'exec-1',
      status: JobExecutionStatus.SUCCEEDED,
      queueName: 'content.pipeline',
      jobName: 'research.run',
      payloadJson: { topicId: 'topic-1' },
    });

    await expect(service.replayExecution('exec-1', 'admin-1')).rejects.toThrow(BadRequestException);
  });

  it('returns idempotent replay result when replay job already exists', async () => {
    const { service, queue, jobExecutionRepository, queueRegistry } = buildService();
    jobExecutionRepository.findExecutionById.mockResolvedValue({
      id: 'exec-1',
      status: JobExecutionStatus.FAILED,
      queueName: 'content.pipeline',
      jobName: 'research.run',
      payloadJson: { topicId: 'topic-1' },
    });
    queue.getJob.mockResolvedValue({ id: 'replay:content.pipeline:research.run:exec-1' });

    const result = await service.replayExecution('exec-1', 'admin-1');

    expect(queueRegistry.resolve).toHaveBeenCalledWith('content.pipeline');
    expect(queue.add).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        replayed: true,
        idempotent: true,
      }),
    );
  });

  it('replays failed executions with contract envelope metadata', async () => {
    const { service, queue, jobExecutionRepository } = buildService();
    jobExecutionRepository.findExecutionById.mockResolvedValue({
      id: 'exec-2',
      status: JobExecutionStatus.FAILED,
      queueName: 'content.pipeline',
      jobName: 'research.run',
      payloadJson: { topicId: 'topic-2' },
    });
    queue.getJob.mockResolvedValue(null);
    queue.add.mockResolvedValue({ id: 'replay:content.pipeline:research.run:exec-2' });

    const result = await service.replayExecution('exec-2', 'admin-1');

    expect(queue.add).toHaveBeenCalledWith(
      'research.run',
      expect.objectContaining({
        topicId: 'topic-2',
        contractVersion: 1,
        idempotencyKey: 'replay:content.pipeline:research.run:exec-2',
      }),
      expect.objectContaining({ jobId: 'replay:content.pipeline:research.run:exec-2' }),
    );
    expect(result.replayed).toBe(true);
  });
});
