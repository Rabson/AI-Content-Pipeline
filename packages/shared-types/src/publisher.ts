export type PublisherChannelKey = 'DEVTO' | 'MEDIUM' | 'LINKEDIN';

export interface PublishRequest {
  title: string;
  markdown: string;
  canonicalUrl?: string;
  tags?: string[];
  summary?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
}

export interface PublisherCredentialSettings {
  mediumAuthorId?: string | null;
  mediumPublicationId?: string | null;
  linkedinAuthorUrn?: string | null;
}

export interface PublisherCredentialInput {
  accessToken?: string;
  settings?: PublisherCredentialSettings | null;
}

export interface PublishResponse {
  externalId: string;
  url: string;
  raw: unknown;
}

export interface PublishVerificationResponse {
  ok: boolean;
  metadata?: Record<string, unknown>;
}

export interface PublisherAdapter<TChannel extends string = PublisherChannelKey> {
  readonly channel: TChannel;
  publish(input: PublishRequest, credential?: PublisherCredentialInput): Promise<PublishResponse>;
  verify?(externalUrl: string): Promise<PublishVerificationResponse>;
}
