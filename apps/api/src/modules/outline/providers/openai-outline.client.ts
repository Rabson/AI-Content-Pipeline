import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '@api/config/env';
import { requestOpenAiChatCompletion } from '@api/common/llm/openai-request.util';
import { OUTLINE_SYSTEM_PROMPT } from '../prompts/outline-system.prompt';
import { OUTLINE_OUTPUT_SCHEMA } from '../prompts/outline-json-schema';
import { buildOutlinePrompt, OutlinePromptInput } from '../prompts/outline.prompt';

@Injectable()
export class OpenAiOutlineClient {
  private readonly model = env.openAiModelDraft;

  async generateOutline(input: OutlinePromptInput): Promise<{
    output: {
      title: string;
      objective: string;
      sections: Array<{ sectionKey: string; heading: string; objective: string; targetWords: number }>;
    };
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const json = await requestOpenAiChatCompletion(
      {
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
          { role: 'user', content: buildOutlinePrompt(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: OUTLINE_OUTPUT_SCHEMA,
        },
      },
      'OpenAI outline generation',
    );
    const content = json?.choices?.[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException('OpenAI returned empty outline content');
    }

    return {
      output: JSON.parse(content),
      usage: json.usage,
    };
  }
}
