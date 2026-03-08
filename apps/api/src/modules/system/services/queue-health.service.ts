import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ANALYTICS_QUEUE } from '@api/modules/analytics/constants/analytics.constants';
import { PUBLISHING_QUEUE } from '@api/modules/publisher/constants/publisher.constants';
import { SOCIAL_QUEUE } from '@api/modules/social/constants/social.constants';
import { CONTENT_PIPELINE_QUEUE } from '@api/modules/topic/constants/topic-queue.constants';

@Injectable()
export class QueueHealthService {
  constructor(
    @InjectQueue(CONTENT_PIPELINE_QUEUE)
    private readonly contentPipelineQueue: Queue,
    @InjectQueue(SOCIAL_QUEUE)
    private readonly socialQueue: Queue,
    @InjectQueue(PUBLISHING_QUEUE)
    private readonly publishingQueue: Queue,
    @InjectQueue(ANALYTICS_QUEUE)
    private readonly analyticsQueue: Queue,
  ) {}

  async check() {
    const queues = [
      ['contentPipeline', this.contentPipelineQueue],
      ['social', this.socialQueue],
      ['publishing', this.publishingQueue],
      ['analytics', this.analyticsQueue],
    ] as const;

    const results = await Promise.all(queues.map(async ([name, queue]) => [name, await this.checkQueue(name, queue)]));
    return Object.fromEntries(results);
  }

  private async checkQueue(name: string, queue: Queue) {
    try {
      const counts = await queue.getJobCounts('active', 'waiting', 'delayed', 'failed');
      return { ok: true, name, counts };
    } catch (error) {
      return {
        ok: false,
        name,
        error: error instanceof Error ? error.message : 'Queue check failed',
      };
    }
  }
}
