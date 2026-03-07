export interface DraftSectionPromptInput {
  topicTitle: string;
  audience?: string | null;
  sectionKey: string;
  heading: string;
  objective: string;
  previousHeading?: string;
  nextHeading?: string;
  researchSummary: string;
  keyPoints: string[];
  styleProfile?: string;
}

export function buildDraftSectionPrompt(input: DraftSectionPromptInput): string {
  return [
    `Topic: ${input.topicTitle}`,
    `Audience: ${input.audience ?? 'N/A'}`,
    `Section key: ${input.sectionKey}`,
    `Heading: ${input.heading}`,
    `Objective: ${input.objective}`,
    `Previous heading: ${input.previousHeading ?? 'N/A'}`,
    `Next heading: ${input.nextHeading ?? 'N/A'}`,
    `Research summary: ${input.researchSummary}`,
    `Key points: ${input.keyPoints.join(' | ')}`,
    `Style profile: ${input.styleProfile ?? 'technical_pragmatic'}`,
    'Output markdown for this section only.',
  ].join('\n');
}
