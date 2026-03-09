import { Body, Controller, Post } from '@nestjs/common';
import { WORKER_INTERNAL_ROUTES } from '@aicp/queue-contracts';
import { AppRole } from '@api/common/auth/roles.enum';
import { assertWorkerContractVersion } from '@api/common/contracts/worker-contract-version';
import { Roles } from '@api/common/decorators/roles.decorator';
import { PublisherOrchestrator } from './publisher.orchestrator';

type PublishArticleBody = {
  publicationId: string;
  topicId: string;
  canonicalUrl?: string;
  tags?: string[];
};

@Controller(WORKER_INTERNAL_ROUTES.publishArticle.controller)
export class PublisherWorkerController {
  constructor(private readonly publisherOrchestrator: PublisherOrchestrator) {}

  @Roles(AppRole.ADMIN)
  @Post(WORKER_INTERNAL_ROUTES.publishArticle.action)
  publish(@Body() body: PublishArticleBody) {
    assertWorkerContractVersion(body);
    return this.publisherOrchestrator.publish({
      publicationId: body.publicationId,
      topicId: body.topicId,
      canonicalUrl: body.canonicalUrl,
      tags: body.tags,
    });
  }
}
