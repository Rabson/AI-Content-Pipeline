import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '../../../config/env';
import { RESEARCH_SYSTEM_PROMPT } from '../prompts/research-system.prompt';
import { buildResearchSynthesisPrompt, ResearchPromptInput } from '../prompts/research-synthesis.prompt';
import { RESEARCH_OUTPUT_SCHEMA } from '../prompts/research-json-schema';

@Injectable()
export class OpenAiResearchClient {
  private readonly model = env.openAiModelResearch;

  async synthesizeStructuredNotes(input: ResearchPromptInput): Promise<{
    output: any;
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
          { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
          { role: 'user', content: buildResearchSynthesisPrompt(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: RESEARCH_OUTPUT_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException('OpenAI response has no content');
    }

    return {
      output: JSON.parse(content),
      usage: json.usage,
    };
  }
}
