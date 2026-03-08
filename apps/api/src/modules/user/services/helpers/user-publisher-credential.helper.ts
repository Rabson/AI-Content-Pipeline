import { Prisma, PublicationChannel } from '@prisma/client';
import { UpsertUserPublisherCredentialDto } from '../../dto/upsert-user-publisher-credential.dto';

export function buildTokenHint(token: string) {
  const trimmed = token.trim();
  return trimmed.length < 4 ? '****' : `****${trimmed.slice(-4)}`;
}

export function buildCredentialSettings(dto: UpsertUserPublisherCredentialDto) {
  const settings = {
    mediumAuthorId: normalizeOptional(dto.mediumAuthorId),
    mediumPublicationId: normalizeOptional(dto.mediumPublicationId),
    linkedinAuthorUrn: normalizeOptional(dto.linkedinAuthorUrn),
  };

  return Object.values(settings).some(Boolean) ? (settings as Prisma.InputJsonValue) : undefined;
}

export function sanitizeCredential(params: {
  channel: PublicationChannel;
  tokenHint?: string | null;
  settingsJson?: Prisma.JsonValue;
  updatedAt: Date;
}) {
  return {
    channel: params.channel,
    tokenHint: params.tokenHint,
    configured: true,
    settings: sanitizeSettings(params.settingsJson),
    updatedAt: params.updatedAt,
  };
}

function sanitizeSettings(settingsJson?: Prisma.JsonValue) {
  if (!settingsJson || typeof settingsJson !== 'object' || Array.isArray(settingsJson)) {
    return null;
  }

  return {
    mediumAuthorId: readSetting(settingsJson, 'mediumAuthorId'),
    mediumPublicationId: readSetting(settingsJson, 'mediumPublicationId'),
    linkedinAuthorUrn: readSetting(settingsJson, 'linkedinAuthorUrn'),
  };
}

function readSetting(value: object, key: string) {
  const setting = (value as Record<string, unknown>)[key];
  return typeof setting === 'string' && setting.trim() ? setting.trim() : null;
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
