import { BadRequestException } from '@nestjs/common';
import {
  QUEUE_PAYLOAD_CONTRACT_VERSION,
  readQueueContractVersion,
} from '@aicp/queue-contracts';

export function assertWorkerContractVersion(payload: unknown) {
  const version = readQueueContractVersion(payload);
  if (version !== QUEUE_PAYLOAD_CONTRACT_VERSION) {
    throw new BadRequestException(
      `Unsupported worker contract version ${version}. Expected ${QUEUE_PAYLOAD_CONTRACT_VERSION}.`,
    );
  }
}
