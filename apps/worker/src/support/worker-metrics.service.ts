import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkerMetricsService {
  private readonly counters = {
    jobsStarted: 0,
    jobsSucceeded: 0,
    jobsFailed: 0,
    retriesDiscarded: 0,
  };

  private readonly queueCounters = new Map<string, { started: number; succeeded: number; failed: number }>();

  recordStart(queueName: string) {
    this.counters.jobsStarted += 1;
    const current = this.queueCounters.get(queueName) ?? { started: 0, succeeded: 0, failed: 0 };
    current.started += 1;
    this.queueCounters.set(queueName, current);
  }

  recordSuccess(queueName: string) {
    this.counters.jobsSucceeded += 1;
    const current = this.queueCounters.get(queueName) ?? { started: 0, succeeded: 0, failed: 0 };
    current.succeeded += 1;
    this.queueCounters.set(queueName, current);
  }

  recordFailure(queueName: string, discarded = false) {
    this.counters.jobsFailed += 1;
    if (discarded) {
      this.counters.retriesDiscarded += 1;
    }
    const current = this.queueCounters.get(queueName) ?? { started: 0, succeeded: 0, failed: 0 };
    current.failed += 1;
    this.queueCounters.set(queueName, current);
  }

  snapshot() {
    return {
      ...this.counters,
      queues: Object.fromEntries(this.queueCounters.entries()),
      timestamp: new Date().toISOString(),
    };
  }
}
