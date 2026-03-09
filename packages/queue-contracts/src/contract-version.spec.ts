import { describe, expect, it } from 'vitest';
import {
  QUEUE_PAYLOAD_CONTRACT_VERSION,
  assertSupportedQueueContractVersion,
  readQueueContractVersion,
  withQueueContractEnvelope,
} from './contract-version';

describe('queue contract version', () => {
  it('defaults missing versions to the current contract version', () => {
    expect(readQueueContractVersion({ topicId: 'topic-1' })).toBe(QUEUE_PAYLOAD_CONTRACT_VERSION);
    expect(readQueueContractVersion(null)).toBe(QUEUE_PAYLOAD_CONTRACT_VERSION);
  });

  it('rejects unsupported versions and accepts compatible payloads', () => {
    expect(assertSupportedQueueContractVersion({ contractVersion: QUEUE_PAYLOAD_CONTRACT_VERSION })).toBe(
      QUEUE_PAYLOAD_CONTRACT_VERSION,
    );
    expect(() => assertSupportedQueueContractVersion({ contractVersion: QUEUE_PAYLOAD_CONTRACT_VERSION + 1 })).toThrow(
      'Unsupported queue payload contract version',
    );
  });

  it('adds envelope metadata for producers', () => {
    const payload = withQueueContractEnvelope(
      { topicId: 'topic-1' },
      {
        idempotencyKey: 'research:topic-1:v1',
        traceId: 'trace-1',
        requestId: 'request-1',
      },
    );

    expect(payload.contractVersion).toBe(QUEUE_PAYLOAD_CONTRACT_VERSION);
    expect(payload.idempotencyKey).toBe('research:topic-1:v1');
    expect(payload.traceId).toBe('trace-1');
    expect(payload.requestId).toBe('request-1');
  });
});
