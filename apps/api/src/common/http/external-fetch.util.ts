import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';

export async function fetchWithTimeout(
  url: string | URL,
  init: RequestInit,
  timeoutMs: number,
  label: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GatewayTimeoutException(`${label} request timed out`);
    }

    throw new BadGatewayException(`${label} request failed`);
  } finally {
    clearTimeout(timer);
  }
}

export async function readResponseSnippet(response: Response, maxLength = 240) {
  const body = await response.text();
  return body.length > maxLength ? `${body.slice(0, maxLength)}...` : body;
}

export async function throwUpstreamHttpError(response: Response, label: string) {
  const snippet = await readResponseSnippet(response);
  const message = `${label} failed: ${response.status}${snippet ? ` ${snippet}` : ''}`;

  if (response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500) {
    throw new ServiceUnavailableException(message);
  }

  throw new BadGatewayException(message);
}

export function assertAllowedHost(rawUrl: string, allowedHosts: string[], label: string) {
  const url = new URL(rawUrl);
  if (!allowedHosts.includes(url.hostname)) {
    throw new BadGatewayException(`${label} host is not allowed`);
  }

  return url;
}
