import { InternalServerErrorException } from '@nestjs/common';
import { env } from '@api/config/env';
import { fetchWithTimeout, throwUpstreamHttpError } from '../http/external-fetch.util';

export async function requestOpenAiChatCompletion(body: Record<string, unknown>, label: string) {
  const apiKey = env.openAiApiKey;
  if (!apiKey) {
    throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
  }

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    env.externalRequestTimeoutMs,
    label,
  );

  if (!response.ok) {
    await throwUpstreamHttpError(response, label);
  }

  return response.json();
}
