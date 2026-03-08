import { Injectable } from '@nestjs/common';
import { ArtifactType } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

@Injectable()
export class ResearchReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicById(topicId: string) {
    return this.prisma.topic.findFirst({
      where: { id: topicId, deletedAt: null },
    });
  }

  async getNextVersion(topicId: string): Promise<number> {
    const latest = await this.prisma.artifactVersion.findFirst({
      where: { topicId, artifactType: ArtifactType.RESEARCH },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return (latest?.versionNumber ?? 0) + 1;
  }

  latestResearchByTopic(topicId: string) {
    return this.prisma.researchArtifact.findFirst({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: {
        sources: true,
        keyPoints: true,
        examples: true,
        artifactVersion: true,
      },
    });
  }

  researchVersions(topicId: string) {
    return this.prisma.artifactVersion.findMany({
      where: { topicId, artifactType: ArtifactType.RESEARCH },
      orderBy: { versionNumber: 'desc' },
    });
  }
}
