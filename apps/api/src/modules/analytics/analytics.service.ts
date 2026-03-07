import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { isPhaseEnabled } from '../../config/feature-flags';
import { ANALYTICS_QUEUE, ANALYTICS_ROLLUP_DAILY_JOB } from './constants/analytics.constants';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { RunRollupDto } from './dto/run-rollup.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository,
    @InjectQueue(ANALYTICS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueDailyRollup(dto: RunRollupDto, actorId: string) {
    if (!isPhaseEnabled(3)) {
      throw new ServiceUnavailableException('Phase 3 features are disabled');
    }

    const usageDate = dto.usageDate ? new Date(dto.usageDate) : new Date();
    usageDate.setUTCHours(0, 0, 0, 0);
    const key = usageDate.toISOString().slice(0, 10);
    const jobId = `analytics:rollup:${key}`;
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      return { enqueued: true, jobId: existingJob.id ?? jobId, usageDate: key, idempotent: true };
    }

    const job = await this.queue.add(
      ANALYTICS_ROLLUP_DAILY_JOB,
      {
        usageDate: usageDate.toISOString(),
        requestedBy: actorId,
      },
      {
        jobId,
      },
    );

    return { enqueued: true, jobId: job.id ?? jobId, usageDate: key };
  }

  getUsage(query: AnalyticsQueryDto) {
    if (!isPhaseEnabled(3)) {
      throw new ServiceUnavailableException('Phase 3 features are disabled');
    }
    return this.repository.getUsageRollups(query.days);
  }

  getOverview(days: number) {
    if (!isPhaseEnabled(3)) {
      throw new ServiceUnavailableException('Phase 3 features are disabled');
    }
    return this.repository.getOverview(days);
  }

  getContentMetrics(contentItemId: string) {
    if (!isPhaseEnabled(3)) {
      throw new ServiceUnavailableException('Phase 3 features are disabled');
    }
    return this.repository.getContentMetrics(contentItemId);
  }
}
