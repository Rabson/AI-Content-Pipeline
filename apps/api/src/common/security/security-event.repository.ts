import { Injectable } from '@nestjs/common';
import { Prisma, SecurityEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecurityEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(params: {
    eventType: SecurityEventType;
    actorUserId?: string | null;
    subjectUserId?: string | null;
    subjectEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    path?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.securityEvent.create({
      data: {
        eventType: params.eventType,
        actorUserId: params.actorUserId,
        subjectUserId: params.subjectUserId,
        subjectEmail: params.subjectEmail,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        path: params.path,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata,
      },
      include: {
        actorUser: { select: { id: true, email: true, role: true, name: true } },
        subjectUser: { select: { id: true, email: true, role: true, name: true } },
      },
    });
  }

  listRecent(params: { limit: number; eventType?: SecurityEventType }) {
    return this.prisma.securityEvent.findMany({
      where: params.eventType ? { eventType: params.eventType } : undefined,
      include: {
        actorUser: { select: { id: true, email: true, role: true, name: true } },
        subjectUser: { select: { id: true, email: true, role: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    });
  }
}
