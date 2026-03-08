import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CasbinAuthorizationService } from '../../../common/auth/casbin-authorization.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { TopicRepository } from '../../topic/topic.repository';
import { UserAccountRepository } from '../repositories/user-account.repository';

@Injectable()
export class UserTopicOwnershipService {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly accountRepository: UserAccountRepository,
    private readonly authorizationService: CasbinAuthorizationService,
  ) {}

  async assignDefaultOwner(topicId: string) {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic || topic.ownerUserId) {
      return topic;
    }

    const user = await this.accountRepository.findFirstActiveUser(UserRole.USER);
    return user ? this.topicRepository.assignOwner(topicId, user.id) : topic;
  }

  async assertTopicReadAccess(actor: AuthenticatedUser | undefined, topicId: string) {
    if (!actor || actor.role !== 'USER') {
      return;
    }

    const owner = await this.topicRepository.findOwner(topicId);
    if (!owner) {
      throw new NotFoundException('Topic not found');
    }
    if (owner?.ownerUserId !== actor.id) {
      throw new ForbiddenException('Topic is not assigned to the authenticated user');
    }
  }

  async assertPublishAccess(actor: AuthenticatedUser, ownerUserId: string | null) {
    if (ownerUserId && actor.id === ownerUserId) {
      return this.authorizationService.assertPublish(actor.role, 'own');
    }
    return this.authorizationService.assertPublish(actor.role, 'any');
  }
}
