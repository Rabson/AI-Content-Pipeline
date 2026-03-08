import { PublicationChannel, PublisherCredentialAuditAction } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { UserPublisherTokenResolverService } from './user-publisher-token-resolver.service';

function createService() {
  const credentialRepository = {
    findByUserAndChannel: vi.fn(),
    updateCredential: vi.fn(),
    createAudit: vi.fn(),
  };
  const tokenCryptoService = {
    decrypt: vi.fn(),
    encrypt: vi.fn(),
    currentKeyVersion: vi.fn(),
  };
  const securityEventService = {
    credentialChanged: vi.fn(),
  };

  return {
    service: new UserPublisherTokenResolverService(
      credentialRepository as any,
      tokenCryptoService as any,
      securityEventService as any,
    ),
    credentialRepository,
    tokenCryptoService,
    securityEventService,
  };
}

describe('UserPublisherTokenResolverService', () => {
  it('returns null when no credential exists', async () => {
    const { service, credentialRepository } = createService();
    credentialRepository.findByUserAndChannel.mockResolvedValue(null);

    await expect(service.resolveCredential('user-1', PublicationChannel.DEVTO)).resolves.toBeNull();
  });

  it('returns the decrypted token and settings', async () => {
    const { service, credentialRepository, tokenCryptoService } = createService();
    credentialRepository.findByUserAndChannel.mockResolvedValue({
      id: 'cred-1',
      userId: 'user-1',
      channel: PublicationChannel.LINKEDIN,
      encryptedToken: 'cipher',
      keyVersion: 2,
      settingsJson: { linkedinAuthorUrn: 'urn:li:person:123' },
    });
    tokenCryptoService.decrypt.mockReturnValue('plain-token');
    tokenCryptoService.currentKeyVersion.mockReturnValue(2);

    await expect(service.resolveCredential('user-1', PublicationChannel.LINKEDIN)).resolves.toEqual({
      accessToken: 'plain-token',
      settings: {
        mediumAuthorId: null,
        mediumPublicationId: null,
        linkedinAuthorUrn: 'urn:li:person:123',
      },
    });
  });

  it('re-encrypts stale credentials when the key version changes', async () => {
    const { service, credentialRepository, tokenCryptoService, securityEventService } = createService();
    credentialRepository.findByUserAndChannel.mockResolvedValue({
      id: 'cred-1',
      userId: 'user-1',
      channel: PublicationChannel.MEDIUM,
      encryptedToken: 'old-cipher',
      keyVersion: 1,
      tokenHint: 'medi...1234',
      settingsJson: { mediumAuthorId: 'author-1' },
    });
    tokenCryptoService.decrypt.mockReturnValue('plain-token');
    tokenCryptoService.currentKeyVersion.mockReturnValue(2);
    tokenCryptoService.encrypt.mockReturnValue('new-cipher');

    await service.resolveCredential('user-1', PublicationChannel.MEDIUM);

    expect(credentialRepository.updateCredential).toHaveBeenCalledWith('cred-1', expect.objectContaining({
      encryptedToken: 'new-cipher',
      keyVersion: 2,
    }));
    expect(credentialRepository.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: PublisherCredentialAuditAction.REENCRYPTED,
      encryptedToken: 'new-cipher',
      keyVersion: 2,
    }));
    expect(securityEventService.credentialChanged).toHaveBeenCalled();
  });
});
