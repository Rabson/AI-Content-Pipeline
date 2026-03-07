import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DRAFT_SECTION_SYSTEM_PROMPT } from '../prompts/draft-system.prompt';
import { buildDraftSectionPrompt, DraftSectionPromptInput } from '../prompts/draft-section.prompt';

@Injectable()
export class OpenAiDraftClient {
  private readonly model = process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini';

  async generateSectionMarkdown(input: DraftSectionPromptInput): Promise<{
    markdown: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: DRAFT_SECTION_SYSTEM_PROMPT },
          { role: 'user', content: buildDraftSectionPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`OpenAI draft generation failed: ${response.status}`);
    }

    const json = await response.json();
    const markdown = json?.choices?.[0]?.message?.content;

    if (!markdown || typeof markdown !== 'string') {
      throw new InternalServerErrorException('Invalid draft section output');
    }

    return { markdown, usage: json.usage };
  }
}
