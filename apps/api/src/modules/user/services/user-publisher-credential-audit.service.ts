import { Injectable } from '@nestjs/common';
import { Prisma, PublicationChannel, PublisherCredentialAuditAction } from '@prisma/client';
import { SecurityEventService } from '../../../common/security/security-event.service';
import { UserPublisherCredentialRepository } from '../repositories/user-publisher-credential.repository';

@Injectable()
export class UserPublisherCredentialAuditService {
  constructor(
    private readonly credentialRepository: UserPublisherCredentialRepository,
    private readonly securityEventService: SecurityEventService,
  ) {}

  async recordChange(
    action: PublisherCredentialAuditAction,
    params: {
      actorUserId: string;
      userId: string;
      channel: PublicationChannel;
      credentialId?: string | null;
      encryptedToken?: string | null;
      keyVersion: number;
      tokenHint?: string | null;
      settingsJson?: unknown;
    },
  ) {
    await this.credentialRepository.createAudit({
      credentialId: params.credentialId,
      userId: params.userId,
      actorUserId: params.actorUserId,
      channel: params.channel,
      action,
      encryptedToken: params.encryptedToken,
      keyVersion: params.keyVersion,
      tokenHint: params.tokenHint,
      settingsJson: (params.settingsJson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    });
    await this.securityEventService.credentialChanged(action, {
      actorUserId: params.actorUserId,
      subjectUserId: params.userId,
      resourceType: 'publisher-credential',
      resourceId: params.credentialId,
      channel: params.channel,
      keyVersion: params.keyVersion,
    });
  }
}
