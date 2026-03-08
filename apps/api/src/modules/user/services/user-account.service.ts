import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserAccountRepository } from '../repositories/user-account.repository';
import { PasswordService } from './password.service';

@Injectable()
export class UserAccountService {
  constructor(
    private readonly accountRepository: UserAccountRepository,
    private readonly passwordService: PasswordService,
  ) {}

  listUsers() {
    return this.accountRepository.listUsers();
  }

  async getUser(userId: string) {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.accountRepository.findByEmail(dto.email.trim().toLowerCase());
    if (existing) {
      throw new ConflictException('User email is already in use');
    }

    return this.accountRepository.create({
      email: dto.email.trim().toLowerCase(),
      name: dto.name?.trim() || null,
      role: dto.role,
      passwordHash: this.passwordService.hash(dto.password),
    });
  }
}
