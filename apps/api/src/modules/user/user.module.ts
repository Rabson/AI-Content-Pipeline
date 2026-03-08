import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TopicRepository } from '../topic/topic.repository';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { UserPublisherCredentialController } from './user-publisher-credential.controller';
import { UserAccountRepository } from './repositories/user-account.repository';
import { UserPublisherCredentialRepository } from './repositories/user-publisher-credential.repository';
import { PasswordService } from './services/password.service';
import { TokenCryptoService } from './services/token-crypto.service';
import { UserAccountService } from './services/user-account.service';
import { UserAuthService } from './services/user-auth.service';
import { UserPublisherCredentialService } from './services/user-publisher-credential.service';
import { UserPublisherTokenResolverService } from './services/user-publisher-token-resolver.service';
import { UserTopicOwnershipService } from './services/user-topic-ownership.service';

@Module({
  controllers: [AuthController, UserController, UserPublisherCredentialController],
  providers: [
    PrismaService,
    TopicRepository,
    UserAccountRepository,
    UserPublisherCredentialRepository,
    PasswordService,
    TokenCryptoService,
    UserPublisherTokenResolverService,
    UserAccountService,
    UserAuthService,
    UserPublisherCredentialService,
    UserTopicOwnershipService,
  ],
  exports: [
    UserAuthService,
    UserAccountService,
    UserPublisherCredentialService,
    UserPublisherTokenResolverService,
    UserTopicOwnershipService,
  ],
})
export class UserModule {}
