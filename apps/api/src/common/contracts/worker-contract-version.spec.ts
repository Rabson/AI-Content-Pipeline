import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertWorkerContractVersion } from './worker-contract-version';

describe('assertWorkerContractVersion', () => {
  it('accepts legacy payloads and current version payloads', () => {
    expect(() => assertWorkerContractVersion({ topicId: 'topic-1' })).not.toThrow();
    expect(() => assertWorkerContractVersion({ topicId: 'topic-1', contractVersion: 1 })).not.toThrow();
  });

  it('rejects unsupported versions', () => {
    expect(() => assertWorkerContractVersion({ contractVersion: 2 })).toThrow(BadRequestException);
  });
});
