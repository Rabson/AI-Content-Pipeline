# TODO - AI Content Pipeline

Audit basis:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- targeted review of auth, dashboard session flow, external fetch clients, uploads, ops, and error handling

## Security

- Replace untrusted header-based API identity in non-local environments.
  - Current gap: [`auth.guard.ts`](./apps/api/src/common/guards/auth.guard.ts) accepts `x-actor-id`, `x-actor-role`, and `x-user-email` without verifying a trusted proxy signature or JWT.
  - Target: signed upstream identity, internal service token, or verified JWT/session handoff.

- Harden dashboard authentication beyond shared access-code + email-domain checks.
  - Current gap: [`auth-options.ts`](./apps/dashboard/src/lib/auth-options.ts) relies on one shared access code for all users.
  - Target: SSO/OIDC or per-user credentials, admin-only bootstrap, and access-code rotation rules.

- Add rate limiting and login throttling.
  - Current gap: no throttling on dashboard sign-in or API mutation routes.
  - Target: per-IP and per-user limits on auth, publish, replay, and upload endpoints.

- Add API security middleware.
  - Current gap: [`main.ts`](./apps/api/src/main.ts) does not enable `helmet`, explicit CORS policy, or request-size limits.
  - Target: security headers, origin allowlist, proxy-aware trust settings, and body limits.

- Sanitize production error payloads and logs.
  - Current gap: [`http-exception.filter.ts`](./apps/api/src/common/filters/http-exception.filter.ts) returns detailed error bodies to clients.
  - Current gap: [`devto.client.ts`](./apps/api/src/modules/publisher/providers/devto.client.ts) embeds full upstream payloads in thrown errors.
  - Target: stable public error codes, internal correlation IDs, and secret/payload redaction.

- Restrict object upload inputs.
  - Current gap: [`storage-signing.service.ts`](./apps/api/src/modules/storage/services/storage-signing.service.ts) signs uploads for any filename and mime type.
  - Target: mime allowlist, extension validation, size caps, and post-upload verification.

- Restrict outbound provider targets.
  - Current gap: [`hacker-news-discovery.provider.ts`](./apps/api/src/modules/discovery/providers/hacker-news-discovery.provider.ts) uses an env-provided base URL directly.
  - Target: provider host allowlist and SSRF-safe outbound client policy.

- Add CI security gates.
  - Target: secret scanning, dependency audit, lockfile review, and basic SAST on pull requests.

## Auth and Access Control

- Make invalid actor roles fail closed.
  - Current gap: [`auth.guard.ts`](./apps/api/src/common/guards/auth.guard.ts) falls back to `EDITOR` for unknown roles.
  - Target: reject unknown roles explicitly.

- Add endpoint-by-endpoint RBAC tests.
  - Cover ops, publish, replay, upload, and topic approval flows.

- Document and enforce trusted-caller rules for dashboard -> API header forwarding.
  - Target: one explicit contract for local, staging, and production.

## External IO and Reliability

- Add timeouts and abort logic for all outbound `fetch` calls.
  - Current gap: discovery, Dev.to, worker/runtime clients, and OpenAI-facing clients do not consistently enforce request deadlines.

- Add retry classification coverage for API-side external clients.
  - Current gap: worker retry policy exists, but API-side outbound clients still treat many upstream failures as generic internal errors.

- Normalize external failure handling.
  - Target: stable upstream error taxonomy for discovery, publishing, storage, and LLM providers.

## Observability

- Add structured security/audit events for auth failures, replay attempts, and publish actions.
- Add alert thresholds for repeated auth failures and repeated failed job replays.
- Add explicit redaction tests for logs and error formatting.

## Test Coverage

- Add integration tests for non-local auth behavior.
  - verify headers alone are rejected once trusted identity enforcement is introduced

- Add dashboard auth flow tests.
  - sign-in failure states, role resolution, and protected-route redirects

- Add storage/upload validation tests.
- Add external client timeout/error mapping tests.

## Documentation

- Add a dedicated security model doc under `docs/`.
  - auth model
  - secret handling
  - trusted proxy/service assumptions
  - upload and publish risk boundaries

- Add an environment variable reference by service.
  - API
  - worker
  - dashboard
  - local-only vs deploy-only values
