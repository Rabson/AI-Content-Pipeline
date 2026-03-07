export interface ParsedErrorInfo {
  code?: string | null;
  message: string;
  details?: unknown;
}

export function extractErrorMessage(error: unknown): string {
  return parseErrorInfo(error).message;
}

export function parseErrorInfo(error: unknown): ParsedErrorInfo {
  if (error instanceof Error) {
    return parseMessageString(error.message);
  }

  if (typeof error === 'string') {
    return parseMessageString(error);
  }

  if (typeof error === 'object' && error !== null) {
    return normalizeErrorObject(error);
  }

  return { message: 'Unexpected error' };
}

function parseMessageString(message: string): ParsedErrorInfo {
  const trimmed = message.trim();
  if (!trimmed) return { message: 'Unexpected error' };

  try {
    return normalizeErrorObject(JSON.parse(trimmed));
  } catch {
    return { message: trimmed };
  }
}

function normalizeErrorObject(input: unknown): ParsedErrorInfo {
  const payload = asRecord(input);
  const nested = asRecord(payload.error);
  const details = nested.details ?? payload.details ?? null;
  return {
    code: toOptionalString(nested.code ?? payload.code ?? null),
    message: pickMessage(nested.message ?? payload.message ?? nested.error ?? payload.error),
    details,
  };
}

function pickMessage(value: unknown): string {
  if (Array.isArray(value)) {
    const messages = value.map((item) => String(item).trim()).filter(Boolean);
    return messages.length ? messages.join('\n') : 'Request failed';
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return 'Request failed';
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function toOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
