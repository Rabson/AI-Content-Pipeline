import { signServiceToken } from '@aicp/auth-core';
import { env } from '@api/config/env';

export function createUserApiToken(params: {
  userId: string;
  email: string;
  role: string;
  name?: string | null;
}) {
  return {
    apiToken: signServiceToken({
      secret: env.internalServiceJwtSecret,
      issuer: env.internalServiceJwtIssuer,
      audience: env.internalServiceJwtAudience,
      subject: params.userId,
      email: params.email,
      role: params.role,
      name: params.name,
      ttlSeconds: env.internalServiceJwtTtlSeconds,
    }),
    apiTokenExpiresInSeconds: env.internalServiceJwtTtlSeconds,
  };
}
