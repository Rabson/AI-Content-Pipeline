export interface RevisionPromptInput {
  topicTitle: string;
  sectionKey: string;
  heading: string;
  currentSectionMarkdown: string;
  instructionMd: string;
  commentTexts: string[];
}

export function buildRevisionPrompt(input: RevisionPromptInput): string {
  return [
    `Topic: ${input.topicTitle}`,
    `Section key: ${input.sectionKey}`,
    `Heading: ${input.heading}`,
    `Instruction: ${input.instructionMd}`,
    `Mapped comments: ${input.commentTexts.join(' | ')}`,
    'Current section markdown:',
    input.currentSectionMarkdown,
    'Return revised markdown only for this section.',
  ].join('\n\n');
}
