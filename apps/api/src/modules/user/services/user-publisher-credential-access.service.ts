import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '@api/common/interfaces/authenticated-request.interface';
import { CasbinAuthorizationService } from '@api/common/auth/casbin-authorization.service';
import { UserAccountRepository } from '../repositories/user-account.repository';

@Injectable()
export class UserPublisherCredentialAccessService {
  constructor(
    private readonly accountRepository: UserAccountRepository,
    private readonly authorizationService: CasbinAuthorizationService,
  ) {}

  async assertOwnCredentialAccess(actor: AuthenticatedUser) {
    await this.ensureUser(actor.id);
    await this.authorizationService.assertCredentialAccess(actor.role, 'own');
  }

  async assertCredentialScope(actor: AuthenticatedUser, targetUserId: string, ownScope: 'own' | 'any') {
    const scope = actor.id === targetUserId ? ownScope : 'any';
    await this.authorizationService.assertCredentialAccess(actor.role, scope);
    if (scope === 'any' && actor.id !== targetUserId) {
      throw new ForbiddenException('Cross-user credential access is not enabled');
    }
  }

  private async ensureUser(userId: string) {
    if (!(await this.accountRepository.findById(userId))) {
      throw new NotFoundException('User not found');
    }
  }
}
