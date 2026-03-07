import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '../../../config/env';
import { REVISION_SECTION_SYSTEM_PROMPT } from '../prompts/revision-system.prompt';
import { buildRevisionPrompt, RevisionPromptInput } from '../prompts/revision-section.prompt';

@Injectable()
export class OpenAiRevisionClient {
  private readonly model = env.openAiModelDraft;

  async reviseSection(input: RevisionPromptInput): Promise<{
    markdown: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const apiKey = env.openAiApiKey;
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
        temperature: 0.2,
        messages: [
          { role: 'system', content: REVISION_SECTION_SYSTEM_PROMPT },
          { role: 'user', content: buildRevisionPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`OpenAI revision failed: ${response.status}`);
    }

    const json = await response.json();
    const markdown = json?.choices?.[0]?.message?.content;

    if (!markdown || typeof markdown !== 'string') {
      throw new InternalServerErrorException('Invalid revision markdown output');
    }

    return { markdown, usage: json.usage };
  }
}
