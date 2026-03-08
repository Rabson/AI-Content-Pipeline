import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '@api/config/env';
import { requestOpenAiChatCompletion } from '@api/common/llm/openai-request.util';
import { DRAFT_SECTION_SYSTEM_PROMPT } from '../prompts/draft-system.prompt';
import { buildDraftSectionPrompt, DraftSectionPromptInput } from '../prompts/draft-section.prompt';

@Injectable()
export class OpenAiDraftClient {
  private readonly model = env.openAiModelDraft;

  async generateSectionMarkdown(input: DraftSectionPromptInput): Promise<{
    markdown: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const json = await requestOpenAiChatCompletion(
      {
        model: this.model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: DRAFT_SECTION_SYSTEM_PROMPT },
          { role: 'user', content: buildDraftSectionPrompt(input) },
        ],
      },
      'OpenAI draft generation',
    );
    const markdown = json?.choices?.[0]?.message?.content;

    if (!markdown || typeof markdown !== 'string') {
      throw new InternalServerErrorException('Invalid draft section output');
    }

    return { markdown, usage: json.usage };
  }
}
