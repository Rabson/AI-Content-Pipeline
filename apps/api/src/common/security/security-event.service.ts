import { Injectable } from '@nestjs/common';
import { env } from '../../config/env';
import { AppLogger } from '../logger/app-logger.service';

interface Entry {
  count: number;
  resetAt: number;
}

@Injectable()
export class SecurityEventService {
  private readonly counters = new Map<string, Entry>();

  constructor(private readonly logger: AppLogger) {}

  authFailure(metadata: Record<string, unknown>) {
    this.bumpThreshold('auth-failure');
    this.logger.warn({ event: 'auth-failure', ...metadata }, 'SecurityEventService');
  }

  replayRequested(metadata: Record<string, unknown>) {
    this.logger.log({ event: 'job-replay-requested', ...metadata }, 'SecurityEventService');
  }

  publishRequested(metadata: Record<string, unknown>) {
    this.logger.log({ event: 'publish-requested', ...metadata }, 'SecurityEventService');
  }

  private bumpThreshold(key: string) {
    const now = Date.now();
    const entry = this.counters.get(key);
    if (!entry || entry.resetAt <= now) {
      this.counters.set(key, { count: 1, resetAt: now + env.securityAlertWindowMs });
      return;
    }

    entry.count += 1;
    if (entry.count === env.securityAlertThreshold) {
      this.logger.error(
        { event: 'security-alert-threshold-reached', key, count: entry.count },
        undefined,
        'SecurityEventService',
      );
    }
  }
}
