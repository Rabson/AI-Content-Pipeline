import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppRole } from '../../../common/auth/roles.enum';
import { UserAccountRepository } from '../repositories/user-account.repository';
import { PasswordService } from './password.service';

export class AuthenticatedUserView {
  id!: string;
  email!: string;
  role!: AppRole;
  name?: string | null;
}

@Injectable()
export class UserAuthService {
  constructor(
    private readonly accountRepository: UserAccountRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async login(email: string, password: string): Promise<AuthenticatedUserView> {
    const user = await this.accountRepository.findByEmail(email.trim().toLowerCase());
    if (!user?.isActive || !this.passwordService.verify(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as AppRole,
      name: user.name,
    };
  }
}
