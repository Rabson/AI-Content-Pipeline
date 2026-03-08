import { Injectable } from '@nestjs/common';
import { env } from '@api/config/env';
import { requestOpenAiChatCompletion } from '@api/common/llm/openai-request.util';

export interface SocialGenerationInput {
  topicTitle: string;
  topicBrief?: string | null;
  markdown?: string | null;
}

export interface LinkedInDraftOutput {
  platform: 'LINKEDIN';
  headline: string;
  post: string;
  hashtags: string[];
  callToAction: string;
}

@Injectable()
export class SocialGeneratorService {
  private readonly model = env.openAiModelDraft;

  async generateLinkedIn(input: SocialGenerationInput): Promise<{
    output: LinkedInDraftOutput;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    if (!env.openAiApiKey) {
      return { output: this.fallback(input) };
    }

    try {
      const json = await requestOpenAiChatCompletion(
        this.buildRequest(input),
        'OpenAI social generation',
      );
      return {
        output: JSON.parse(json.choices[0].message.content) as LinkedInDraftOutput,
        usage: json.usage,
      };
    } catch {
      return { output: this.fallback(input) };
    }
  }

  private buildRequest(input: SocialGenerationInput) {
    return {
      model: this.model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'Generate a LinkedIn draft for technical content. Return valid JSON only.',
        },
        {
          role: 'user',
          content: JSON.stringify(input),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'linkedin_draft',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['platform', 'headline', 'post', 'hashtags', 'callToAction'],
            properties: {
              platform: { type: 'string' },
              headline: { type: 'string' },
              post: { type: 'string' },
              hashtags: { type: 'array', items: { type: 'string' } },
              callToAction: { type: 'string' },
            },
          },
        },
      },
    };
  }
  private fallback(input: SocialGenerationInput): LinkedInDraftOutput {
    const post = [
      `We just pushed a new long-form piece on ${input.topicTitle}.`,
      input.topicBrief ?? 'It breaks down the problem, the implementation path, and the tradeoffs.',
      'If you are building an AI-assisted content system, this workflow is production-focused rather than demo-driven.',
    ].join(' ');

    return {
      platform: 'LINKEDIN',
      headline: input.topicTitle,
      post,
      hashtags: ['#AI', '#ContentOps', '#Engineering'],
      callToAction: 'Read the full markdown draft and adapt it to your publishing workflow.',
    };
  }
}
