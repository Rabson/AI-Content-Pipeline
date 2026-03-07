import { TopicStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ResearchService } from '../research.service';

describe('ResearchService', () => {
  it('enqueues research job with an idempotent key', async () => {
    const queue = {
      getJob: vi.fn().mockResolvedValue({ id: 'research:topic:1:v1' }),
    } as any;
    const repository = {
      findTopicById: vi.fn().mockResolvedValue({ id: 'topic-1', status: TopicStatus.APPROVED }),
    } as any;

    const service = new ResearchService(
      repository,
      {} as any,
      { assertTopicTransition: vi.fn() } as any,
      queue,
    );

    const result = await service.enqueue('topic-1', { traceId: 'trace-1' }, 'editor-1');

    expect(result).toEqual(
      expect.objectContaining({
        enqueued: true,
        idempotent: true,
      }),
    );
    expect(queue.getJob).toHaveBeenCalledWith('research:topic:topic-1:v1');
  });

  it('returns the latest structured research artifact', async () => {
    const repository = {
      latestResearchByTopic: vi.fn(),
      findTopicById: vi.fn(),
      researchVersions: vi.fn(),
    } as any;

    const artifact = {
      summary: 'Structured notes',
      confidenceScore: 0.81,
      sources: [],
      keyPoints: [],
      examples: [],
      artifactVersion: { versionNumber: 1 },
    };
    repository.latestResearchByTopic = vi.fn().mockResolvedValue(artifact);

    const service = new ResearchService(repository, {} as any, {} as any, {} as any);
    const result = await service.getLatest('topic-1');

    expect(result.summary).toBe('Structured notes');
    expect(result.version).toBe(1);
  });
});
