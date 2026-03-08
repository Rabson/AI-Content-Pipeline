import { Prisma } from '@prisma/client';
import { ServiceUnavailableException } from '@nestjs/common';
import { isPhaseEnabled } from '@api/config/feature-flags';

export function assertDiscoveryEnabled() {
  if (!isPhaseEnabled(3)) {
    throw new ServiceUnavailableException('Phase 3 features are disabled');
  }
}

export function discoveryJsonValue(value?: Record<string, unknown> | null): Prisma.InputJsonValue | null {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function extractDiscoveryTokens(title: string, tags: string[]) {
  return [...new Set([title, ...tags]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4))];
}
