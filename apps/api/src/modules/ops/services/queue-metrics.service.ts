import { Injectable } from '@nestjs/common';
import { JobExecutionRepository } from '../repositories/job-execution.repository';
import { QueueRegistryService } from './queue-registry.service';

@Injectable()
export class QueueMetricsService {
  constructor(
    private readonly jobExecutionRepository: JobExecutionRepository,
    private readonly queueRegistry: QueueRegistryService,
  ) {}

  async snapshot() {
    const queueEntries = await Promise.all(
      this.queueRegistry.entries().map(async ([name, queue]) => [
        name,
        await queue.getJobCounts(
          'active',
          'completed',
          'delayed',
          'failed',
          'paused',
          'prioritized',
          'waiting',
          'waiting-children',
        ),
      ]),
    );

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const executions = await this.jobExecutionRepository.countExecutionsSince(last24Hours);

    return {
      queues: Object.fromEntries(queueEntries),
      executionsLast24Hours: executions.reduce<Record<string, Record<string, number>>>((acc, item) => {
        acc[item.queueName] ??= {};
        acc[item.queueName][item.status] = item._count._all;
        return acc;
      }, {}),
      timestamp: new Date().toISOString(),
    };
  }
}
