export function readString(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function readBoolean(name: string, fallback = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function firstCsvValue(raw: string | undefined, fallback: string): string {
  return raw?.split(',')[0]?.trim() || fallback;
}

export function readNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}
