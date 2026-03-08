import { PublicationChannel } from '@prisma/client';

export interface PublishRequest {
  title: string;
  markdown: string;
  canonicalUrl?: string;
  tags?: string[];
  summary?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
}

export interface PublisherCredentialInput {
  accessToken?: string;
  settings?: {
    mediumAuthorId?: string | null;
    mediumPublicationId?: string | null;
    linkedinAuthorUrn?: string | null;
  } | null;
}

export interface PublishResponse {
  externalId: string;
  url: string;
  raw: unknown;
}

export interface PublisherAdapter {
  readonly channel: PublicationChannel;
  publish(input: PublishRequest, credential?: PublisherCredentialInput): Promise<PublishResponse>;
  verify?(externalUrl: string): Promise<{ ok: boolean; metadata?: Record<string, unknown> }>;
}
