import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { CasbinAuthorizationService } from '../../../common/auth/casbin-authorization.service';
import { UpsertUserPublisherCredentialDto } from '../dto/upsert-user-publisher-credential.dto';
import { UserAccountRepository } from '../repositories/user-account.repository';
import { UserPublisherCredentialRepository } from '../repositories/user-publisher-credential.repository';
import { TokenCryptoService } from './token-crypto.service';
import { UserPublisherTokenResolverService } from './user-publisher-token-resolver.service';

@Injectable()
export class UserPublisherCredentialService {
  constructor(
    private readonly accountRepository: UserAccountRepository,
    private readonly credentialRepository: UserPublisherCredentialRepository,
    private readonly authorizationService: CasbinAuthorizationService,
    private readonly tokenCryptoService: TokenCryptoService,
    private readonly tokenResolver: UserPublisherTokenResolverService,
  ) {}

  async listOwn(userId: string) {
    const credentials = await this.credentialRepository.listByUser(userId);
    return credentials.map(sanitizeCredential);
  }

  async upsertOwn(actor: AuthenticatedUser, channel: PublicationChannel, dto: UpsertUserPublisherCredentialDto) {
    await this.assertCredentialScope(actor, actor.id, 'own');
    await this.ensureUser(actor.id);
    return sanitizeCredential(await this.credentialRepository.upsert({
      userId: actor.id,
      channel,
      encryptedToken: this.tokenCryptoService.encrypt(dto.token.trim()),
      tokenHint: buildTokenHint(dto.token),
    }));
  }

  async deleteOwn(actor: AuthenticatedUser, channel: PublicationChannel) {
    await this.assertCredentialScope(actor, actor.id, 'own');
    await this.credentialRepository.delete(actor.id, channel);
    return { deleted: true, channel };
  }

  async resolveToken(userId: string, channel: PublicationChannel) {
    return this.tokenResolver.resolveToken(userId, channel);
  }

  private async ensureUser(userId: string) {
    if (!(await this.accountRepository.findById(userId))) {
      throw new NotFoundException('User not found');
    }
  }

  private async assertCredentialScope(actor: AuthenticatedUser, targetUserId: string, ownScope: 'own' | 'any') {
    const scope = actor.id === targetUserId ? ownScope : 'any';
    await this.authorizationService.assertCredentialAccess(actor.role, scope);
    if (scope === 'any' && actor.id !== targetUserId) {
      throw new ForbiddenException('Cross-user credential access is not enabled');
    }
  }
}

function buildTokenHint(token: string) {
  const trimmed = token.trim();
  return trimmed.length < 4 ? '****' : `****${trimmed.slice(-4)}`;
}

function sanitizeCredential({
  channel,
  tokenHint,
  updatedAt,
}: {
  channel: PublicationChannel;
  tokenHint?: string | null;
  updatedAt: Date;
}) {
  return { channel, tokenHint, configured: true, updatedAt };
}
