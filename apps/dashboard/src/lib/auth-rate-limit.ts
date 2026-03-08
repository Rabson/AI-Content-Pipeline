interface Entry {
  count: number;
  resetAt: number;
}

const entries = new Map<string, Entry>();

export function enforceAuthRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error('Too many sign-in attempts. Try again later.');
  }

  current.count += 1;
}

export function clearAuthRateLimit(key: string) {
  entries.delete(key);
}
