import { RESEARCH_OUTPUT_SCHEMA } from './research-json-schema';

export interface ResearchPromptInput {
  topicTitle: string;
  topicBrief?: string | null;
  audience?: string | null;
  sources: Array<{
    id: string;
    url: string;
    title?: string | null;
    excerpt?: string | null;
    snippets?: string[];
  }>;
}

export function buildResearchSynthesisPrompt(input: ResearchPromptInput): string {
  return [
    `Topic: ${input.topicTitle}`,
    `Brief: ${input.topicBrief ?? 'N/A'}`,
    `Audience: ${input.audience ?? 'N/A'}`,
    'Use only provided sources and cite by source id.',
    'Return JSON matching this schema:',
    JSON.stringify(RESEARCH_OUTPUT_SCHEMA.schema),
    'Sources:',
    JSON.stringify(input.sources),
  ].join('\n\n');
}
