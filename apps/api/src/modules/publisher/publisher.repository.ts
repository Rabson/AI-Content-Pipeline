import { Injectable, NotFoundException } from '@nestjs/common';
import { DraftVersionStatus, Prisma, PublicationChannel, PublicationStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

@Injectable()
export class PublisherRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
      include: {
        contentItem: true,
        bannerImage: true,
        owner: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  }

  getLatestDraft(topicId: string) {
    return this.prisma.draftVersion.findFirst({
      where: { topicId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  getLatestApprovedDraft(topicId: string) {
    return this.prisma.draftVersion.findFirst({
      where: { topicId, status: DraftVersionStatus.APPROVED },
      orderBy: { versionNumber: 'desc' },
    });
  }

  getApprovedDraftByVersion(topicId: string, versionNumber: number) {
    return this.prisma.draftVersion.findFirst({
      where: { topicId, versionNumber, status: DraftVersionStatus.APPROVED },
    });
  }

  listPublications(topicId: string) {
    return this.prisma.publication.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: {
        attempts: { orderBy: { createdAt: 'desc' } },
        draftVersion: true,
        topic: { include: { bannerImage: true } },
        publisherUser: { select: { id: true, email: true, name: true, role: true } },
        requestedByUser: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  }

  listFailedPublications(limit: number) {
    return this.prisma.publication.findMany({
      where: { status: PublicationStatus.FAILED },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        attempts: { orderBy: { createdAt: 'desc' } },
        draftVersion: true,
        topic: { include: { owner: { select: { id: true, email: true, name: true, role: true } } } },
        publisherUser: { select: { id: true, email: true, name: true, role: true } },
        requestedByUser: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  }

  findPendingPublication(topicId: string, channel: PublicationChannel, publisherUserId?: string) {
    return this.prisma.publication.findFirst({
      where: {
        topicId,
        channel,
        publisherUserId,
        status: PublicationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPublicationShell(params: {
    topicId: string;
    contentItemId?: string;
    draftVersionId: string;
    channel: PublicationChannel;
    requestedByUserId?: string;
    publisherUserId?: string;
    title: string;
    payload: Record<string, unknown>;
  }) {
    return this.prisma.publication.create({
      data: {
        topicId: params.topicId,
        contentItemId: params.contentItemId,
        draftVersionId: params.draftVersionId,
        channel: params.channel,
        requestedByUserId: params.requestedByUserId,
        publisherUserId: params.publisherUserId,
        title: params.title,
        payloadJson: params.payload as Prisma.InputJsonValue,
        status: PublicationStatus.PENDING,
        lockedForPublish: true,
      },
    });
  }

  async recordAttempt(params: {
    publicationId: string;
    status: PublicationStatus;
    requestPayload?: Record<string, unknown>;
    responsePayload?: Record<string, unknown>;
    error?: string;
  }) {
    return this.prisma.publicationAttempt.create({
      data: {
        publicationId: params.publicationId,
        status: params.status,
        requestPayloadJson: params.requestPayload as Prisma.InputJsonValue | undefined,
        responsePayloadJson: params.responsePayload as Prisma.InputJsonValue | undefined,
        error: params.error,
      },
    });
  }

  async markPublished(params: {
    publicationId: string;
    externalId: string;
    externalUrl: string;
    verificationStatus?: string;
  }) {
    return this.prisma.publication.update({
      where: { id: params.publicationId },
      data: {
        status: PublicationStatus.PUBLISHED,
        externalId: params.externalId,
        externalUrl: params.externalUrl,
        publishedAt: new Date(),
        verifiedAt: params.verificationStatus === 'verified' ? new Date() : null,
        verificationStatus: params.verificationStatus,
        error: null,
      },
      include: { attempts: true, draftVersion: true },
    });
  }

  markFailed(publicationId: string, error: string) {
    return this.prisma.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.FAILED,
        error,
        verificationStatus: 'failed',
      },
    });
  }

  async getPublicationOrThrow(publicationId: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        draftVersion: true,
        topic: {
          include: {
            contentItem: true,
            bannerImage: true,
            owner: { select: { id: true, email: true, role: true, name: true } },
          },
        },
        publisherUser: true,
        attempts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    return publication;
  }

  findPublicationById(topicId: string, publicationId: string) {
    return this.prisma.publication.findFirst({
      where: { id: publicationId, topicId },
      include: {
        draftVersion: true,
        topic: {
          include: {
            contentItem: true,
            bannerImage: true,
            owner: { select: { id: true, email: true, role: true, name: true } },
          },
        },
        publisherUser: true,
        requestedByUser: true,
        attempts: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  markRetryRequested(publicationId: string) {
    return this.prisma.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.PENDING,
        error: null,
        lockedForPublish: true,
      },
    });
  }
}
