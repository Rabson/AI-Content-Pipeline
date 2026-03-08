import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '../../../config/env';
import { requestOpenAiChatCompletion } from '../../../common/llm/openai-request.util';
import { REVISION_SECTION_SYSTEM_PROMPT } from '../prompts/revision-system.prompt';
import { buildRevisionPrompt, RevisionPromptInput } from '../prompts/revision-section.prompt';

@Injectable()
export class OpenAiRevisionClient {
  private readonly model = env.openAiModelDraft;

  async reviseSection(input: RevisionPromptInput): Promise<{
    markdown: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const json = await requestOpenAiChatCompletion(
      {
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: REVISION_SECTION_SYSTEM_PROMPT },
          { role: 'user', content: buildRevisionPrompt(input) },
        ],
      },
      'OpenAI revision generation',
    );
    const markdown = json?.choices?.[0]?.message?.content;

    if (!markdown || typeof markdown !== 'string') {
      throw new InternalServerErrorException('Invalid revision markdown output');
    }

    return { markdown, usage: json.usage };
  }
}
