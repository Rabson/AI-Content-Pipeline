export const QUEUE_PAYLOAD_CONTRACT_VERSION = 1 as const;

export interface QueueContractEnvelope {
  contractVersion?: number;
  idempotencyKey?: string;
  traceId?: string;
  requestId?: string;
}

function isObjectPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}

export function readQueueContractVersion(payload: unknown): number {
  if (!isObjectPayload(payload)) return QUEUE_PAYLOAD_CONTRACT_VERSION;
  const version = payload.contractVersion;
  return Number.isInteger(version) && (version as number) > 0
    ? (version as number)
    : QUEUE_PAYLOAD_CONTRACT_VERSION;
}

export function assertSupportedQueueContractVersion(payload: unknown): number {
  const version = readQueueContractVersion(payload);
  if (version !== QUEUE_PAYLOAD_CONTRACT_VERSION) {
    throw new Error(
      `Unsupported queue payload contract version ${version}. Expected ${QUEUE_PAYLOAD_CONTRACT_VERSION}.`,
    );
  }
  return version;
}

export function withQueueContractEnvelope<T extends object>(
  payload: T,
  options?: {
    idempotencyKey?: string;
    contractVersion?: number;
    traceId?: string;
    requestId?: string;
  },
): T &
  Required<Pick<QueueContractEnvelope, 'contractVersion'>> &
  Pick<QueueContractEnvelope, 'idempotencyKey' | 'traceId' | 'requestId'> {
  return {
    ...payload,
    contractVersion: options?.contractVersion ?? QUEUE_PAYLOAD_CONTRACT_VERSION,
    ...(options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
    ...(options?.traceId ? { traceId: options.traceId } : {}),
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  } as T &
    Required<Pick<QueueContractEnvelope, 'contractVersion'>> &
    Pick<QueueContractEnvelope, 'idempotencyKey' | 'traceId' | 'requestId'>;
}
