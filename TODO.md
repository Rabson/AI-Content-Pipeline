# TODO - AI Content Pipeline

Status: open on 2026-03-08 after code audit.

Audit basis:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build:api`
- `npm run build:worker`
- `npm run build:dashboard`
- runtime check for API, worker, and dashboard health/readiness
- targeted code review of auth, publish, worker, and dashboard boundaries

## Security

- Replace shared internal header auth with stronger service-to-service auth.
  - Current state: `apps/api/src/common/guards/auth.guard.ts` trusts `x-actor-*` headers when `x-internal-api-token` matches a shared secret.
  - Target: signed JWT or service identity flow with short-lived credentials and issuer/audience checks.

- Move dashboard sign-in rate limiting out of in-memory process state.
  - Current state: `apps/dashboard/src/lib/auth-rate-limit.ts`
  - Target: Redis-backed rate limiting so throttling survives restarts and multiple instances.

- Add account lockout and login security audit events.
  - Current state: login succeeds/fails through `apps/dashboard/src/lib/auth-options.ts` and `apps/api/src/modules/user/services/user-auth.service.ts`, but there is no persistent lockout or security event history for repeated credential abuse.

- Add publisher credential rotation and revoke flow.
  - Current state: tokens can be stored and overwritten, but there is no versioning, revoke history, or forced re-encryption flow.
  - Relevant files:
    - `apps/api/src/modules/user/services/token-crypto.service.ts`
    - `apps/api/src/modules/user/services/user-publisher-credential.service.ts`

- Review dashboard session cookie settings for non-local deployment.
  - Current state: auth works, but production cookie policy should be verified explicitly for `secure`, `sameSite`, and proxy/HTTPS behavior.
  - Relevant file: `apps/dashboard/src/lib/auth-options.ts`

## Publishing and User Workflow

No open backlog items in this section after the current publish/ownership/banner implementation pass.

## Architecture and Code Structure

- Decouple worker runtime from API source internals.
  - Current state: `apps/worker/src/worker.module.ts` imports many providers directly from `apps/api/src/...`
  - Target: move worker-safe domain services, queue contracts, and provider interfaces into shared packages or worker-owned modules.

## UI and UX

No open backlog items in this section after the dashboard theme and responsive polish pass.

## Testing

- Add integration tests for email/password login and role/session mapping.
  - Relevant files:
    - `apps/api/src/modules/user/services/user-auth.service.ts`
    - `apps/dashboard/src/lib/auth-options.ts`

- Add integration tests for topic ownership visibility.
  - Cases:
    - `USER` sees only assigned topics
    - `ADMIN` sees all topics
    - `ADMIN` can publish on behalf of owner
    - `USER` cannot publish unassigned content

- Add tests for publisher credential encryption/decryption across API and worker.
  - Relevant files:
    - `apps/api/src/modules/user/services/token-crypto.service.ts`
    - `apps/api/src/modules/user/services/user-publisher-token-resolver.service.ts`
    - `apps/worker/src/processors/publish.processor.ts`

- Add tests for publish failure handling and retry semantics.
  - Cases:
    - missing draft markdown
    - missing credential
    - external adapter error
    - verification failure

- Add dashboard tests for publish/account/sign-in error states.
  - Current state: backend validation display exists, but publisher/account flows need the same coverage level.

## Operations and Observability

- Add persistent security/audit history for:
  - login failures
  - credential changes
  - publish requests
  - admin-on-behalf publishing

- Add queue/job dashboards for failed publish attempts and recovery actions.
  - Current Ops page shows runtime health, but not enough publish-specific operational detail.

- Replace Terraform starter placeholders with real provider modules.
  - Current state: `infra/terraform/README.md` is still starter-level only.

## Documentation

- Add owner-assignment and publish-permission flow to docs.
  - Explain:
    - when approved posts get assigned to `USER`
    - what `USER` can publish
    - what `ADMIN` can publish on behalf of user

- Add security deployment notes for non-local environments.
  - Include:
    - `INTERNAL_API_TOKEN`
    - secure cookie/session expectations
    - disabling local bypass
    - token/key rotation guidance
