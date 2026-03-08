import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PublicationChannel } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PublisherOrchestrator } from './publisher.orchestrator';

function buildPublication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'publication-1',
    title: 'Topic title',
    channel: PublicationChannel.DEVTO,
    publisherUserId: 'user-1',
    draftVersion: {
      id: 'draft-1',
      assembledMarkdown: '# Heading',
    },
    topic: {
      brief: 'Topic brief',
      bannerImage: { publicUrl: 'https://cdn.example.com/banner.png' },
      bannerImageAlt: 'Banner alt',
    },
    ...overrides,
  };
}

function createService(publication = buildPublication()) {
  const repository = {
    getPublicationOrThrow: vi.fn().mockResolvedValue(publication),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    markPublished: vi.fn().mockResolvedValue({ id: 'publication-1', status: 'PUBLISHED' }),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
  const adapter = { publish: vi.fn() };
  const registry = { get: vi.fn().mockReturnValue(adapter) };
  const verifier = { verify: vi.fn().mockResolvedValue({ ok: true }) };
  const workflowService = {
    transitionContentState: vi.fn().mockResolvedValue(undefined),
    lockForPublish: vi.fn().mockResolvedValue(undefined),
  };
  const credentialResolver = { resolveCredential: vi.fn().mockResolvedValue({ accessToken: 'token' }) };
  return {
    service: new PublisherOrchestrator(
      repository as any,
      registry as any,
      verifier as any,
      workflowService as any,
      credentialResolver as any,
    ),
    repository,
    adapter,
    verifier,
    workflowService,
    credentialResolver,
  };
}

describe('PublisherOrchestrator', () => {
  it('rejects publish when the pinned draft markdown is missing', async () => {
    const { service } = createService(buildPublication({ draftVersion: { id: 'draft-1', assembledMarkdown: '' } }));
    await expect(service.publish({ publicationId: 'publication-1', topicId: 'topic-1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('marks publication failed when a channel credential is missing', async () => {
    const { service, adapter, repository, workflowService, credentialResolver } = createService();
    credentialResolver.resolveCredential.mockResolvedValue(undefined);
    adapter.publish.mockRejectedValue(new InternalServerErrorException('No Dev.to credential is configured for publishing'));
    await expect(service.publish({ publicationId: 'publication-1', topicId: 'topic-1' })).rejects.toThrow('No Dev.to credential is configured for publishing');
    expect(repository.recordAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }));
    expect(repository.markFailed).toHaveBeenCalledWith('publication-1', 'No Dev.to credential is configured for publishing');
    expect(workflowService.transitionContentState).toHaveBeenCalledWith(expect.objectContaining({ toState: 'FAILED' }));
  });

  it('marks publication failed when the adapter throws an external error', async () => {
    const { service, adapter, repository } = createService();
    adapter.publish.mockRejectedValue(new Error('external publish failed'));
    await expect(service.publish({ publicationId: 'publication-1', topicId: 'topic-1' })).rejects.toThrow('external publish failed');
    expect(repository.markFailed).toHaveBeenCalledWith('publication-1', 'external publish failed');
  });

  it('marks successful publishes as unverified when verification fails', async () => {
    const { service, adapter, repository, verifier, workflowService } = createService();
    adapter.publish.mockResolvedValue({ externalId: 'ext-1', url: 'https://example.com/post', raw: { ok: true } });
    verifier.verify.mockResolvedValue({ ok: false, metadata: { reason: 'not-visible-yet' } });

    await service.publish({ publicationId: 'publication-1', topicId: 'topic-1' });

    expect(repository.markPublished).toHaveBeenCalledWith(expect.objectContaining({
      publicationId: 'publication-1',
      verificationStatus: 'unverified',
    }));
    expect(workflowService.lockForPublish).toHaveBeenCalledWith('topic-1', 'draft-1', false);
  });
});
