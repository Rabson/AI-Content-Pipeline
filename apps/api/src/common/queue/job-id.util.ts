export function buildQueueJobId(...parts: Array<string | number | null | undefined>) {
  return parts
    .filter((part) => part !== null && part !== undefined && String(part).length > 0)
    .map((part) => String(part).replace(/[^a-zA-Z0-9._-]/g, '-'))
    .join('__');
}
