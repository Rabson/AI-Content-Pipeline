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

- Implement banner image workflow for articles.
  - Scope:
    - banner image upload/generation flow
    - storage and metadata persistence
    - draft/publish linkage to the selected banner
    - dashboard UI for preview, replace, and validation
  - Relevant areas:
    - `apps/api/src/modules/storage`
    - `apps/api/src/modules/publisher`
    - `apps/dashboard/src/app/topics/[topicId]/publish`
    - `packages/shared-types`

- Implement Medium publishing adapter.
  - Current state: `apps/api/src/modules/publisher/providers/medium.adapter.ts` returns `ServiceUnavailableException`.

- Implement LinkedIn publishing adapter.
  - Current state: `apps/api/src/modules/publisher/providers/linkedin.adapter.ts` returns `ServiceUnavailableException`.

- Remove DEVTO-only publish restriction once other adapters exist.
  - Current state: `apps/api/src/modules/publisher/publisher.service.ts` hard-blocks all channels except `DEVTO`.

- Add dashboard UI for channel availability and missing credential guidance.
  - Current state: users can save credentials, but publish UX should clearly show:
    - supported channels
    - unsupported channels
    - missing credential state
    - publish ownership rules

- Add admin workflow for topic owner reassignment.
  - Current state: approved content is assigned to a `USER`, but there is no admin UI/API workflow to reassign ownership cleanly after approval.

- Add publish retry/requeue controls for failed publications.
  - Current state: failures are recorded, but operator recovery is limited.
  - Relevant files:
    - `apps/api/src/modules/publisher/publisher.orchestrator.ts`
    - `apps/api/src/modules/publisher/publisher.repository.ts`
    - `apps/dashboard/src/app/topics/[topicId]/publish/page.tsx`

## Architecture and Code Structure

- Decouple worker runtime from API source internals.
  - Current state: `apps/worker/src/worker.module.ts` imports many providers directly from `apps/api/src/...`
  - Target: move worker-safe domain services, queue contracts, and provider interfaces into shared packages or worker-owned modules.

- Move queue names and job payload contracts into shared packages.
  - Current state: worker and API still share queue constants through API module paths.
  - Target: `packages/shared-types` or `packages/shared-config` should own these contracts.

- Replace generic `throw new Error(...)` paths in core orchestrators with typed exceptions or result objects.
  - High-value files:
    - `apps/api/src/modules/research/research.orchestrator.ts`
    - `apps/api/src/modules/draft/draft.orchestrator.ts`
    - `apps/api/src/modules/revision/revision.orchestrator.ts`
    - `apps/api/src/modules/publisher/publisher.orchestrator.ts`
    - `apps/api/src/modules/workflow/workflow-*.ts`

- Resolve the remaining Next.js ESLint plugin warning during `next build`.
  - Current state: builds pass, but Next still reports plugin detection mismatch.

- Review generated/runtime artifact strategy for dashboard route types.
  - Current state: `apps/dashboard/next-env.d.ts` changes when build output path changes.
  - Target: stable local/Docker behavior without noisy generated diffs.

## UI and UX

- Implement dashboard dark mode.
  - Scope:
    - theme token system for light/dark palettes
    - user theme preference persistence
    - accessible contrast review across dashboard screens
    - theme toggle in shared dashboard chrome
  - Relevant areas:
    - `apps/dashboard/src/app/globals.css`
    - `apps/dashboard/src/components/shared`
    - `apps/dashboard/src/app`

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

- Add explicit publisher support matrix to docs.
  - Clarify:
    - `DEVTO` implemented
    - `MEDIUM` stored credentials only, publishing not implemented
    - `LINKEDIN` stored credentials only, publishing not implemented

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
