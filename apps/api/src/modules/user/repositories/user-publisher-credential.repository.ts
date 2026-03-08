import { Injectable } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserPublisherCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserAndChannel(userId: string, channel: PublicationChannel) {
    return this.prisma.userPublisherCredential.findUnique({
      where: { userId_channel: { userId, channel } },
    });
  }

  listByUser(userId: string) {
    return this.prisma.userPublisherCredential.findMany({
      where: { userId },
      orderBy: { channel: 'asc' },
    });
  }

  upsert(params: { userId: string; channel: PublicationChannel; encryptedToken: string; tokenHint?: string }) {
    return this.prisma.userPublisherCredential.upsert({
      where: { userId_channel: { userId: params.userId, channel: params.channel } },
      update: { encryptedToken: params.encryptedToken, tokenHint: params.tokenHint },
      create: params,
    });
  }

  delete(userId: string, channel: PublicationChannel) {
    return this.prisma.userPublisherCredential.deleteMany({
      where: { userId, channel },
    });
  }

  listConfiguredUsers(channel: PublicationChannel) {
    return this.prisma.userPublisherCredential.findMany({
      where: { channel },
      select: { userId: true },
    });
  }
}
