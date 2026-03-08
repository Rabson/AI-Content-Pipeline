import { Injectable } from '@nestjs/common';
import { Prisma, PublicationChannel, PublisherCredentialAuditAction } from '@prisma/client';
import { SecurityEventService } from '@api/common/security/security-event.service';
import { UserPublisherCredentialRepository } from '../repositories/user-publisher-credential.repository';
import { TokenCryptoService } from './token-crypto.service';

@Injectable()
export class UserPublisherTokenResolverService {
  constructor(
    private readonly credentialRepository: UserPublisherCredentialRepository,
    private readonly tokenCryptoService: TokenCryptoService,
    private readonly securityEventService: SecurityEventService,
  ) {}

  async resolveToken(userId: string, channel: PublicationChannel) {
    const credential = await this.credentialRepository.findByUserAndChannel(userId, channel);
    if (!credential) {
      return null;
    }
    const accessToken = this.tokenCryptoService.decrypt(credential.encryptedToken);
    await this.rotateIfNeeded(credential, accessToken);
    return accessToken;
  }

  async resolveCredential(userId: string, channel: PublicationChannel) {
    const credential = await this.credentialRepository.findByUserAndChannel(userId, channel);
    if (!credential) {
      return null;
    }

    const accessToken = this.tokenCryptoService.decrypt(credential.encryptedToken);
    await this.rotateIfNeeded(credential, accessToken);

    return {
      accessToken,
      settings: sanitizeCredentialSettings(credential.settingsJson),
    };
  }

  private async rotateIfNeeded(
    credential: {
      id: string;
      userId: string;
      channel: PublicationChannel;
      encryptedToken: string;
      keyVersion: number;
      tokenHint?: string | null;
      settingsJson?: Prisma.JsonValue;
    },
    accessToken: string,
  ) {
    const currentKeyVersion = this.tokenCryptoService.currentKeyVersion();
    if (credential.keyVersion >= currentKeyVersion) {
      return;
    }

    const encryptedToken = this.tokenCryptoService.encrypt(accessToken);
    await this.credentialRepository.updateCredential(credential.id, {
      encryptedToken,
      keyVersion: currentKeyVersion,
      tokenHint: credential.tokenHint ?? undefined,
      settingsJson: credential.settingsJson as Prisma.InputJsonValue | undefined,
    });
    await this.credentialRepository.createAudit({
      credentialId: credential.id,
      userId: credential.userId,
      channel: credential.channel,
      action: PublisherCredentialAuditAction.REENCRYPTED,
      encryptedToken,
      keyVersion: currentKeyVersion,
      tokenHint: credential.tokenHint,
      settingsJson: credential.settingsJson as Prisma.InputJsonValue | undefined,
    });
    await this.securityEventService.credentialChanged(PublisherCredentialAuditAction.REENCRYPTED, {
      subjectUserId: credential.userId,
      resourceType: 'publisher-credential',
      resourceId: credential.id,
      channel: credential.channel,
      keyVersion: currentKeyVersion,
    });
  }
}

function sanitizeCredentialSettings(settingsJson?: Prisma.JsonValue) {
  if (!settingsJson || typeof settingsJson !== 'object' || Array.isArray(settingsJson)) {
    return null;
  }

  return {
    mediumAuthorId: readSetting(settingsJson, 'mediumAuthorId'),
    mediumPublicationId: readSetting(settingsJson, 'mediumPublicationId'),
    linkedinAuthorUrn: readSetting(settingsJson, 'linkedinAuthorUrn'),
  };
}

function readSetting(value: object, key: string) {
  const setting = (value as Record<string, unknown>)[key];
  return typeof setting === 'string' && setting.trim() ? setting.trim() : null;
}
