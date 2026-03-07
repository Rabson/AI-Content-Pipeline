import { env } from './env';

export function isPhaseEnabled(phase: 2 | 3): boolean {
  if (phase === 2) return env.featurePhase2Enabled;
  if (phase === 3) return env.featurePhase3Enabled;
  return env.appEnv === 'local';
}

export function assertPhaseEnabled(phase: 2 | 3) {
  if (!isPhaseEnabled(phase)) {
    throw new Error(`Phase ${phase} features are disabled in this environment`);
  }
}
