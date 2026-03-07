import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '../../../config/env';

export interface DevtoPublishInput {
  title: string;
  markdown: string;
  canonicalUrl?: string;
  tags?: string[];
}

@Injectable()
export class DevtoClient {
  async publish(input: DevtoPublishInput): Promise<{ externalId: string; url: string; raw: unknown }> {
    const apiKey = env.devtoApiKey;
    if (!apiKey) {
      throw new InternalServerErrorException('DEVTO_API_KEY is not configured');
    }

    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          title: input.title,
          body_markdown: input.markdown,
          published: true,
          canonical_url: input.canonicalUrl,
          tags: input.tags,
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Dev.to publish failed: ${response.status} ${JSON.stringify(payload)}`,
      );
    }

    return {
      externalId: String(payload.id),
      url: payload.url as string,
      raw: payload,
    };
  }
}
