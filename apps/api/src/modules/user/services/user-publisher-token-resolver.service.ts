import { Injectable } from '@nestjs/common';
import { Prisma, PublicationChannel } from '@prisma/client';
import { UserPublisherCredentialRepository } from '../repositories/user-publisher-credential.repository';
import { TokenCryptoService } from './token-crypto.service';

@Injectable()
export class UserPublisherTokenResolverService {
  constructor(
    private readonly credentialRepository: UserPublisherCredentialRepository,
    private readonly tokenCryptoService: TokenCryptoService,
  ) {}

  async resolveToken(userId: string, channel: PublicationChannel) {
    const credential = await this.credentialRepository.findByUserAndChannel(userId, channel);
    if (!credential) {
      return null;
    }

    return this.tokenCryptoService.decrypt(credential.encryptedToken);
  }

  async resolveCredential(userId: string, channel: PublicationChannel) {
    const credential = await this.credentialRepository.findByUserAndChannel(userId, channel);
    if (!credential) {
      return null;
    }

    return {
      accessToken: this.tokenCryptoService.decrypt(credential.encryptedToken),
      settings: sanitizeCredentialSettings(credential.settingsJson),
    };
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
