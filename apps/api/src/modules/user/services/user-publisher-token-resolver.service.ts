import { Injectable } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
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
}
