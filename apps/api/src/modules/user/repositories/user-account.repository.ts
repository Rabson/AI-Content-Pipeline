import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  failedLoginAttempts: true,
  lastLoginAt: true,
  lastFailedLoginAt: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UserAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, select: userSummarySelect });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { publisherCredentials: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: userSummarySelect });
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: userSummarySelect,
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
    });
  }

  findFirstActiveUser(role: UserRole) {
    return this.prisma.user.findFirst({
      where: { role, isActive: true },
      select: { id: true, email: true, name: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  recordFailedLogin(userId: string, lockedUntil?: Date | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
        lockedUntil: lockedUntil ?? null,
      },
      select: userSummarySelect,
    });
  }

  clearLoginFailures(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
      select: userSummarySelect,
    });
  }
}
