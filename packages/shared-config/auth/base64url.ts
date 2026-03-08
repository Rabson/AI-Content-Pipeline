export function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

export function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}
