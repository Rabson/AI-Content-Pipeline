export const SECURITY_EVENT_RUNTIME_CONFIG = Symbol('SECURITY_EVENT_RUNTIME_CONFIG');

export interface SecurityEventRuntimeConfig {
  securityAlertThreshold: number;
  securityAlertWindowMs: number;
}
