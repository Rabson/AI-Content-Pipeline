export function isPhaseEnabled(phase: 2 | 3): boolean {
  const envName = phase === 2 ? 'NEXT_PUBLIC_FEATURE_PHASE2_ENABLED' : 'NEXT_PUBLIC_FEATURE_PHASE3_ENABLED';
  const raw = process.env[envName];
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }

  return (process.env.NEXT_PUBLIC_APP_ENV ?? 'local') === 'local';
}
