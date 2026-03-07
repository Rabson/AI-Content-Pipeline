import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueRegistryService {
  constructor(
    @InjectQueue('content.pipeline')
    private readonly contentPipelineQueue: Queue,
    @InjectQueue('publishing')
    private readonly publishingQueue: Queue,
    @InjectQueue('social')
    private readonly socialQueue: Queue,
    @InjectQueue('analytics')
    private readonly analyticsQueue: Queue,
  ) {}

  entries() {
    return [
      ['contentPipeline', this.contentPipelineQueue],
      ['publishing', this.publishingQueue],
      ['social', this.socialQueue],
      ['analytics', this.analyticsQueue],
    ] as const;
  }

  resolve(queueName: string) {
    if (queueName === 'publishing') {
      return this.publishingQueue;
    }
    if (queueName === 'social') {
      return this.socialQueue;
    }
    if (queueName === 'analytics') {
      return this.analyticsQueue;
    }

    return this.contentPipelineQueue;
  }
}
