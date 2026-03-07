import { createHash } from 'crypto';
import { GenerateDraftDto } from '../dto/generate-draft.dto';
import { DraftPayload } from './draft-generation.types';

export function buildDraftPayload(
  topicId: string,
  topic: { brief: string | null; title: string },
  sections: Array<{ sectionKey: string; heading: string; position: number; objective: string; targetWords: number | null }>,
  dto: GenerateDraftDto,
): DraftPayload {
  return {
    topicId,
    styleProfile: dto.styleProfile ?? 'technical_pragmatic',
    traceId: dto.traceId,
    sectionPlan: sections.map((section) => ({
      sectionKey: section.sectionKey,
      heading: section.heading,
      position: section.position,
      objective: section.objective,
      targetWords: section.targetWords,
      researchSummary: topic.brief ?? topic.title,
      keyPoints: [topic.title],
    })),
  };
}

export function hashDraftPayload(payload: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
