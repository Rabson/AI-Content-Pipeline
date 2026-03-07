import type { PrismaService } from '../../../prisma/prisma.service';
import type { ManualSourceInput } from './research-write.types';

export function addManualSource(
  prisma: PrismaService,
  latestResearchId: string,
  data: ManualSourceInput,
) {
  return prisma.sourceReference.create({
    data: {
      researchArtifactId: latestResearchId,
      url: data.url,
      domain: data.domain,
      title: data.title,
      excerpt: data.excerpt,
      sourceType: data.sourceType,
    },
  });
}
