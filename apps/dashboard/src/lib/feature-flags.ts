import { env } from '../config/env';

export function isPhaseEnabled(phase: 2 | 3): boolean {
  return phase === 2 ? env.featurePhase2Enabled : env.featurePhase3Enabled;
}
