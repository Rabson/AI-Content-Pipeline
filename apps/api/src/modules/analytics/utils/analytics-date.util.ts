export function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export function startOfUtcDay(value: Date) {
  const normalized = new Date(value);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

export function usageDateKey(value: Date) {
  return startOfUtcDay(value).toISOString();
}
