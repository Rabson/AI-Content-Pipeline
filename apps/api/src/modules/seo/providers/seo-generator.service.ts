import { Injectable } from '@nestjs/common';

export interface SeoGenerationInput {
  topicTitle: string;
  topicBrief?: string | null;
  markdown?: string | null;
}

export interface SeoGenerationOutput {
  title: string;
  metaDescription: string;
  canonicalSlug: string;
  keywords: string[];
  openGraphTitle: string;
  openGraphDescription: string;
}

@Injectable()
export class SeoGeneratorService {
  private readonly model = process.env.OPENAI_MODEL_DRAFT ?? 'gpt-4.1-mini';

  async generate(input: SeoGenerationInput): Promise<{
    output: SeoGenerationOutput;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        output: this.fallback(input),
      };
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
      return {
        output: this.fallback(input),
      };
    }

    return this.parseResponse(response);
  }

  private buildRequest(input: SeoGenerationInput) {
    return {
      model: this.model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Generate SEO metadata for technical content. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: JSON.stringify(input),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'seo_metadata',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'title',
              'metaDescription',
              'canonicalSlug',
              'keywords',
              'openGraphTitle',
              'openGraphDescription',
            ],
            properties: {
              title: { type: 'string' },
              metaDescription: { type: 'string' },
              canonicalSlug: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
              openGraphTitle: { type: 'string' },
              openGraphDescription: { type: 'string' },
            },
          },
        },
      },
    };
  }

  private async parseResponse(response: Response) {
    const json = await response.json();
    return {
      output: JSON.parse(json.choices[0].message.content) as SeoGenerationOutput,
      usage: json.usage,
    };
  }

  private fallback(input: SeoGenerationInput): SeoGenerationOutput {
    const description = (input.topicBrief ?? input.markdown ?? input.topicTitle)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155);
    const keywords = input.topicTitle
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .slice(0, 6);

    return {
      title: input.topicTitle.slice(0, 60),
      metaDescription: description,
      canonicalSlug: input.topicTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80),
      keywords,
      openGraphTitle: input.topicTitle.slice(0, 65),
      openGraphDescription: description,
    };
  }
}
