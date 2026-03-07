import { Injectable } from '@nestjs/common';

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
  private readonly model = process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini';

  async generateLinkedIn(input: SocialGenerationInput): Promise<{
    output: LinkedInDraftOutput;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    if (!process.env.OPENAI_API_KEY) {
      return { output: this.fallback(input) };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.buildRequest(input)),
    });

    if (!response.ok) {
      return { output: this.fallback(input) };
    }

    return this.parseResponse(response);
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

  private async parseResponse(response: Response) {
    const json = await response.json();
    return {
      output: JSON.parse(json.choices[0].message.content) as LinkedInDraftOutput,
      usage: json.usage,
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
