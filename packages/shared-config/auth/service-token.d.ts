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
export declare function signServiceToken(params: {
    secret: string;
    issuer: string;
    audience: string;
    subject: string;
    email: string;
    role: string;
    name?: string | null;
    ttlSeconds: number;
}): string;
export declare function verifyServiceToken(params: {
    token: string;
    secret: string;
    expectedIssuer: string;
    expectedAudience: string;
    clockSkewSeconds?: number;
}): ServiceTokenClaims;
export {};
