import { Body, Controller, Post } from '@nestjs/common';
import {
  WORKER_INTERNAL_ROUTES,
  type DiscoveryImportJobPayload,
} from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { DiscoveryService } from './discovery.service';

@Controller(WORKER_INTERNAL_ROUTES.discoveryImport.controller)
export class DiscoveryWorkerController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.discoveryImport.action)
  runImport(@Body() payload: DiscoveryImportJobPayload) {
    assertWorkerContractVersion(payload);
    return this.discoveryService.runImport(payload);
  }
}
