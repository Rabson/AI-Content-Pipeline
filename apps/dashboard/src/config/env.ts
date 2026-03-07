import {
  firstCsvValue,
  readBoolean,
  readOptional,
  readString,
} from '@aicp/shared-config/env/readers';

const appEnv = readString('NEXT_PUBLIC_APP_ENV', 'local');

export const env = {
  appEnv,
  apiBase:
    readOptional('INTERNAL_API_BASE_URL') ??
    readOptional('API_BASE_URL') ??
    readString('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3001/api'),
  authAdminEmails: readOptional('AUTH_ADMIN_EMAILS'),
  authReviewerEmails: readOptional('AUTH_REVIEWER_EMAILS'),
  authAllowedEmailDomains: readOptional('AUTH_ALLOWED_EMAIL_DOMAINS'),
  dashboardAccessCode: readOptional('DASHBOARD_ACCESS_CODE'),
  featurePhase2Enabled: readBoolean('NEXT_PUBLIC_FEATURE_PHASE2_ENABLED', appEnv === 'local'),
  featurePhase3Enabled: readBoolean('NEXT_PUBLIC_FEATURE_PHASE3_ENABLED', appEnv === 'local'),
  nextDistDir: readString('NEXT_DIST_DIR', '.next'),
  isLocal: appEnv === 'local',
  defaultAdminEmail: firstCsvValue(readOptional('AUTH_ADMIN_EMAILS'), 'operator@example.com'),
  defaultReviewerEmail: firstCsvValue(readOptional('AUTH_REVIEWER_EMAILS'), 'reviewer@example.com'),
  defaultAllowedDomain: firstCsvValue(readOptional('AUTH_ALLOWED_EMAIL_DOMAINS'), 'example.com'),
} as const;
