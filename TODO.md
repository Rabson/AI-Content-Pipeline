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

No open backlog items in this section after the service-token, lockout, credential-audit, and session-cookie hardening pass.

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

No open backlog items in this section after the security-event persistence, publish recovery Ops panels, and Terraform module pass.

## Documentation

No open backlog items in this section after the publish-ownership and security deployment docs refresh.
