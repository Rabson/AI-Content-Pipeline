export function isPhaseEnabled(phase: 2 | 3): boolean {
  const envName = phase === 2 ? 'FEATURE_PHASE2_ENABLED' : 'FEATURE_PHASE3_ENABLED';
  const raw = process.env[envName];
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }

  return (process.env.APP_ENV ?? 'local') === 'local';
}

export function assertPhaseEnabled(phase: 2 | 3) {
  if (!isPhaseEnabled(phase)) {
    throw new Error(`Phase ${phase} features are disabled in this environment`);
  }
}
