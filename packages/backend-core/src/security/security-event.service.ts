import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PublisherCredentialAuditAction, SecurityEventType } from '@prisma/client';
import { AppLogger } from '../logger/app-logger.service';
import { SecurityEventRepository } from './security-event.repository';
import { SECURITY_EVENT_RUNTIME_CONFIG, type SecurityEventRuntimeConfig } from './security-event.constants';

@Injectable()
export class SecurityEventService {
  private readonly counters = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly logger: AppLogger,
    private readonly repository: SecurityEventRepository,
    @Inject(SECURITY_EVENT_RUNTIME_CONFIG)
    private readonly config: SecurityEventRuntimeConfig,
  ) {}

  authFailure(metadata: Record<string, unknown>) { return this.recordWithThreshold('auth-failure', SecurityEventType.AUTH_FAILURE, metadata); }
  loginFailed(metadata: Record<string, unknown>) { return this.recordWithThreshold('login-failed', SecurityEventType.LOGIN_FAILED, metadata); }
  loginSucceeded(metadata: Record<string, unknown>) { return this.record(SecurityEventType.LOGIN_SUCCEEDED, metadata); }
  accountLocked(metadata: Record<string, unknown>) { return this.record(SecurityEventType.ACCOUNT_LOCKED, metadata); }
  replayRequested(metadata: Record<string, unknown>) { return this.record(SecurityEventType.JOB_REPLAY_REQUESTED, metadata); }
  publishRequested(metadata: Record<string, unknown>) { return this.record(SecurityEventType.PUBLISH_REQUESTED, metadata); }
  adminPublishOnBehalf(metadata: Record<string, unknown>) { return this.record(SecurityEventType.ADMIN_PUBLISH_ON_BEHALF, metadata); }

  credentialChanged(action: PublisherCredentialAuditAction, metadata: Record<string, unknown>) {
    const eventType = {
      UPSERTED: SecurityEventType.CREDENTIAL_UPSERTED,
      ROTATED: SecurityEventType.CREDENTIAL_ROTATED,
      REENCRYPTED: SecurityEventType.CREDENTIAL_REENCRYPTED,
      REVOKED: SecurityEventType.CREDENTIAL_REVOKED,
    }[action];
    return this.record(eventType, metadata);
  }

  listRecent(limit: number, eventType?: SecurityEventType) {
    return this.repository.listRecent({ limit, eventType });
  }

  private async recordWithThreshold(key: string, eventType: SecurityEventType, metadata: Record<string, unknown>) {
    this.bumpThreshold(key);
    await this.record(eventType, metadata);
  }

  private bumpThreshold(key: string) {
    const now = Date.now();
    const entry = this.counters.get(key);
    if (!entry || entry.resetAt <= now) {
      this.counters.set(key, { count: 1, resetAt: now + this.config.securityAlertWindowMs });
      return;
    }
    entry.count += 1;
    if (entry.count === this.config.securityAlertThreshold) {
      this.logger.error({ event: 'security-alert-threshold-reached', key, count: entry.count }, undefined, 'SecurityEventService');
    }
  }

  private async record(eventType: SecurityEventType, metadata: Record<string, unknown>) {
    this.logger.log({ event: eventType, ...metadata }, 'SecurityEventService');
    await this.repository.create({
      eventType,
      actorUserId: readStringValue(metadata.actorUserId),
      subjectUserId: readStringValue(metadata.subjectUserId),
      subjectEmail: readStringValue(metadata.subjectEmail),
      ipAddress: readStringValue(metadata.ipAddress),
      userAgent: readStringValue(metadata.userAgent),
      path: readStringValue(metadata.path),
      resourceType: readStringValue(metadata.resourceType),
      resourceId: readStringValue(metadata.resourceId),
      metadata: metadata as Prisma.InputJsonValue,
    });
  }
}

function readStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}
