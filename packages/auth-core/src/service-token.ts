import { createHmac, timingSafeEqual } from 'crypto';
import { decodeBase64Url, encodeBase64Url } from './base64url';

interface ServiceTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  role: string;
  name?: string | null;
  iat: number;
  nbf: number;
  exp: number;
}

function signValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function parseClaims(token: string) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Malformed service token');
  }

  const header = JSON.parse(decodeBase64Url(encodedHeader)) as { alg?: string; typ?: string };
  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Unsupported service token header');
  }

  return {
    encodedHeader,
    encodedPayload,
    signature,
    claims: JSON.parse(decodeBase64Url(encodedPayload)) as ServiceTokenClaims,
  };
}

export function signServiceToken(params: {
  secret: string;
  issuer: string;
  audience: string;
  subject: string;
  email: string;
  role: string;
  name?: string | null;
  ttlSeconds: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = encodeBase64Url(
    JSON.stringify({
      iss: params.issuer,
      aud: params.audience,
      sub: params.subject,
      email: params.email,
      role: params.role,
      name: params.name ?? null,
      iat: now,
      nbf: now,
      exp: now + params.ttlSeconds,
    } satisfies ServiceTokenClaims),
  );
  const signature = signValue(`${encodedHeader}.${encodedPayload}`, params.secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyServiceToken(params: {
  token: string;
  secret: string;
  expectedIssuer: string;
  expectedAudience: string;
  clockSkewSeconds?: number;
}) {
  const { encodedHeader, encodedPayload, signature, claims } = parseClaims(params.token);
  const expectedSignature = signValue(`${encodedHeader}.${encodedPayload}`, params.secret);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid service token signature');
  }

  const now = Math.floor(Date.now() / 1000);
  const clockSkew = params.clockSkewSeconds ?? 30;
  if (claims.iss !== params.expectedIssuer) {
    throw new Error('Invalid service token issuer');
  }
  if (claims.aud !== params.expectedAudience) {
    throw new Error('Invalid service token audience');
  }
  if (claims.nbf > now + clockSkew) {
    throw new Error('Service token not active yet');
  }
  if (claims.exp <= now - clockSkew) {
    throw new Error('Service token expired');
  }

  return claims;
}
