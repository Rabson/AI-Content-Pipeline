import { Injectable } from '@nestjs/common';
import { PublicationChannel, PublisherCredentialAuditAction } from '@prisma/client';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { UpsertUserPublisherCredentialDto } from '../dto/upsert-user-publisher-credential.dto';
import { UserPublisherCredentialRepository } from '../repositories/user-publisher-credential.repository';
import {
  buildCredentialSettings,
  buildTokenHint,
  sanitizeCredential,
} from './helpers/user-publisher-credential.helper';
import { TokenCryptoService } from './token-crypto.service';
import { UserPublisherCredentialAccessService } from './user-publisher-credential-access.service';
import { UserPublisherCredentialAuditService } from './user-publisher-credential-audit.service';
import { UserPublisherTokenResolverService } from './user-publisher-token-resolver.service';

@Injectable()
export class UserPublisherCredentialService {
  constructor(
    private readonly credentialRepository: UserPublisherCredentialRepository,
    private readonly tokenCryptoService: TokenCryptoService,
    private readonly tokenResolver: UserPublisherTokenResolverService,
    private readonly accessService: UserPublisherCredentialAccessService,
    private readonly auditService: UserPublisherCredentialAuditService,
  ) {}

  async listOwn(userId: string) {
    const credentials = await this.credentialRepository.listByUser(userId);
    return credentials.map(sanitizeCredential);
  }

  async upsertOwn(actor: AuthenticatedUser, channel: PublicationChannel, dto: UpsertUserPublisherCredentialDto) {
    await this.accessService.assertOwnCredentialAccess(actor);
    const current = await this.credentialRepository.findByUserAndChannel(actor.id, channel);
    const encryptedToken = this.tokenCryptoService.encrypt(dto.token.trim());
    const keyVersion = this.tokenCryptoService.currentKeyVersion();
    const tokenHint = buildTokenHint(dto.token);
    const settingsJson = buildCredentialSettings(dto);
    const updated = await this.credentialRepository.upsert({
      userId: actor.id,
      channel,
      encryptedToken,
      keyVersion,
      tokenHint,
      settingsJson,
    });
    const action = current
      ? PublisherCredentialAuditAction.ROTATED
      : PublisherCredentialAuditAction.UPSERTED;
    await this.auditService.recordChange(action, {
      actorUserId: actor.id,
      userId: actor.id,
      channel,
      credentialId: updated.id,
      encryptedToken,
      keyVersion,
      tokenHint,
      settingsJson,
    });
    return sanitizeCredential(updated);
  }

  async deleteOwn(actor: AuthenticatedUser, channel: PublicationChannel) {
    await this.accessService.assertOwnCredentialAccess(actor);
    const current = await this.credentialRepository.findByUserAndChannel(actor.id, channel);
    if (current) {
      await this.auditService.recordChange(PublisherCredentialAuditAction.REVOKED, {
        actorUserId: actor.id,
        userId: actor.id,
        channel,
        credentialId: current.id,
        encryptedToken: current.encryptedToken,
        keyVersion: current.keyVersion,
        tokenHint: current.tokenHint,
        settingsJson: current.settingsJson,
      });
    }
    await this.credentialRepository.delete(actor.id, channel);
    return { deleted: true, channel };
  }

  async resolveToken(userId: string, channel: PublicationChannel) {
    return this.tokenResolver.resolveToken(userId, channel);
  }
}
