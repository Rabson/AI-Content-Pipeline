"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signServiceToken = signServiceToken;
exports.verifyServiceToken = verifyServiceToken;
const crypto_1 = require("crypto");
const base64url_1 = require("./base64url");
function signValue(value, secret) {
    return (0, crypto_1.createHmac)('sha256', secret).update(value).digest('base64url');
}
function parseClaims(token) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error('Malformed service token');
    }
    const header = JSON.parse((0, base64url_1.decodeBase64Url)(encodedHeader));
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
        throw new Error('Unsupported service token header');
    }
    return {
        encodedHeader,
        encodedPayload,
        signature,
        claims: JSON.parse((0, base64url_1.decodeBase64Url)(encodedPayload)),
    };
}
function signServiceToken(params) {
    const now = Math.floor(Date.now() / 1000);
    const encodedHeader = (0, base64url_1.encodeBase64Url)(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = (0, base64url_1.encodeBase64Url)(JSON.stringify({
        iss: params.issuer,
        aud: params.audience,
        sub: params.subject,
        email: params.email,
        role: params.role,
        name: params.name ?? null,
        iat: now,
        nbf: now,
        exp: now + params.ttlSeconds,
    }));
    const signature = signValue(`${encodedHeader}.${encodedPayload}`, params.secret);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}
function verifyServiceToken(params) {
    const { encodedHeader, encodedPayload, signature, claims } = parseClaims(params.token);
    const expectedSignature = signValue(`${encodedHeader}.${encodedPayload}`, params.secret);
    if (!(0, crypto_1.timingSafeEqual)(Buffer.from(signature), Buffer.from(expectedSignature))) {
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
