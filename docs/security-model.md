# Security Model

This document defines the current security contract for the local, staging, and production runtimes.

## API Caller Trust
- Local:
  - `APP_ENV=local`
  - `AUTH_ALLOW_HEADER_BYPASS=true`
  - API accepts missing actor headers and injects a local dev identity.
- Non-local:
  - API rejects header-only identity.
  - Caller must send `x-internal-api-token` matching `INTERNAL_API_TOKEN`.
  - Caller must also send:
    - `x-actor-id`
    - `x-actor-role`
    - `x-user-email`
  - Invalid or unknown roles are rejected.

## Dashboard to API Contract
- Dashboard is the intended internal caller for operator actions.
- Dashboard forwards authenticated user identity headers to the API.
- In staging and production, dashboard must also send `x-internal-api-token`.
- Shared access-code auth is acceptable for local/internal use only.
- For non-local deployments, replace local credentials with a real identity provider or verified per-user password flow, and keep `INTERNAL_API_TOKEN` between dashboard and API.

## Role Model
- `ADMIN`
  - ops actions, job replay, full dashboard access
- `REVIEWER`
  - topic scoring, approval/rejection, publish requests
- `EDITOR`
  - topic creation, draft/revision workflows, upload signing
- Unknown roles fail closed.

## Rate Limiting
- Dashboard sign-in is rate-limited by IP and email.
- API mutation routes with higher risk are rate-limited:
  - publish
  - upload signing
  - failed-job replay
- Repeated auth failures emit structured security events.

## API Hardening
- CORS uses an explicit allowlist from `API_CORS_ORIGINS`.
- Request body size is capped by `API_REQUEST_BODY_LIMIT`.
- `helmet` is enabled.
- Non-local deployments trust proxy headers.

## Error Handling and Logging
- Logs are redacted for keys such as:
  - `token`
  - `secret`
  - `password`
  - `accessCode`
  - `apiKey`
- Public error payloads are sanitized outside local development.
- Upstream failure bodies are truncated before being surfaced.

## Upload Controls
- Upload signing validates:
  - filename character set
  - mime type against `STORAGE_ALLOWED_MIME_TYPES`
  - size against `STORAGE_MAX_UPLOAD_BYTES`
- Signed uploads are limited to the configured bucket and object key pattern.

## Outbound Request Controls
- External HTTP requests use deadlines.
- Discovery provider hosts must match `DISCOVERY_ALLOWED_HOSTS`.
- OpenAI, Dev.to, and ops runtime calls use shared timeout/error handling.

## Remaining Risk Boundary
- The current dashboard auth model is still an internal-tool model, not full enterprise SSO.
- Recommended production path:
  - replace shared-code auth with OIDC/SSO
  - keep `INTERNAL_API_TOKEN` or move to JWT/service mesh identity for service-to-service trust
