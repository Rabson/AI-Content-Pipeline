import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
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
}
