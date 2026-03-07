export interface OutlinePromptInput {
  topicTitle: string;
  topicBrief?: string | null;
  audience?: string | null;
  researchSummary?: string | null;
  keyPoints: string[];
}

export function buildOutlinePrompt(input: OutlinePromptInput): string {
  return [
    `Topic: ${input.topicTitle}`,
    `Brief: ${input.topicBrief ?? 'N/A'}`,
    `Audience: ${input.audience ?? 'N/A'}`,
    `Research summary: ${input.researchSummary ?? 'N/A'}`,
    `Key points: ${input.keyPoints.join(' | ')}`,
    'Return a JSON outline with sectionKey, heading, objective, targetWords.',
  ].join('\n');
}
