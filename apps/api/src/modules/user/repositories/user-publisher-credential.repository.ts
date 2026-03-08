import { Injectable } from '@nestjs/common';
import { Prisma, PublicationChannel, PublisherCredentialAuditAction } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

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

  upsert(params: {
    userId: string;
    channel: PublicationChannel;
    encryptedToken: string;
    keyVersion: number;
    tokenHint?: string;
    settingsJson?: Prisma.InputJsonValue;
  }) {
    return this.prisma.userPublisherCredential.upsert({
      where: { userId_channel: { userId: params.userId, channel: params.channel } },
      update: {
        encryptedToken: params.encryptedToken,
        keyVersion: params.keyVersion,
        tokenHint: params.tokenHint,
        settingsJson: params.settingsJson,
      },
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

  updateCredential(id: string, params: {
    encryptedToken: string;
    keyVersion: number;
    tokenHint?: string;
    settingsJson?: Prisma.InputJsonValue;
  }) {
    return this.prisma.userPublisherCredential.update({
      where: { id },
      data: params,
    });
  }

  createAudit(params: {
    credentialId?: string | null;
    userId: string;
    actorUserId?: string | null;
    channel: PublicationChannel;
    action: PublisherCredentialAuditAction;
    encryptedToken?: string | null;
    keyVersion: number;
    tokenHint?: string | null;
    settingsJson?: Prisma.InputJsonValue;
  }) {
    return this.prisma.userPublisherCredentialAudit.create({
      data: {
        credentialId: params.credentialId,
        userId: params.userId,
        actorUserId: params.actorUserId,
        channel: params.channel,
        action: params.action,
        encryptedToken: params.encryptedToken,
        keyVersion: params.keyVersion,
        tokenHint: params.tokenHint,
        settingsJson: params.settingsJson,
      },
    });
  }
}
