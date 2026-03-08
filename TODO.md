# TODO - AI Content Pipeline

Status: open on 2026-03-08 after service-by-service and infra audit.

Audit basis:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build:api`
- `npm run build:worker`
- `npm run build:dashboard`
- runtime check for API, worker, and dashboard health/readiness
- code review of API modules, worker wiring, dashboard routes, shared packages, and infra

## Current Stage by Server and Infra

### API Server (`apps/api`)
Stage: implemented and running, with targeted structural cleanup still pending.

Implemented:
- topic, discovery, research, outline, draft, revision, publish, analytics, ops APIs
- user accounts, email/password login, Casbin RBAC, publisher credential vault
- topic owner assignment and banner-image APIs
- security events, login lockout, publish recovery endpoints
- Prisma/PostgreSQL persistence and BullMQ enqueueing

Open work:
- continue expanding integration coverage for publish retry, worker flows, and edge-case ops behavior

### Worker Server (`apps/worker`)
Stage: implemented and running, but still too tightly coupled to API internals.

Implemented:
- processors for discovery, research, outline, draft, revision, SEO, social, publishing, analytics
- worker health/readiness/metrics endpoints
- retry policy and job execution tracking
- publish adapters for Dev.to, Medium, and LinkedIn

Open work:
- continue decoupling worker runtime from `apps/api/src/...`
- first shared extraction is in place via `@aicp/backend-core` for Prisma/logging/security-event infrastructure
- move remaining worker-safe contracts/services into shared packages or worker-owned modules
- add integration coverage for publish, discovery, and recovery flows

### Dashboard Server (`apps/dashboard`)
Stage: implemented and running, with cleanup and test expansion still pending.

Implemented:
- sign-in with API-backed email/password flow
- role-based dashboard navigation
- topic/discovery/research/draft/revision/publish/analytics/ops routes
- owner reassignment, banner-image UI, publish readiness, retry actions
- dark mode and responsive layout
- ops panels for runtime, queue metrics, failed publications, and security events

Open work:
- continue expanding dashboard route coverage beyond the current sign-in/account/publish/error cases

### Shared Types (`packages/shared-types`)
Stage: implemented and used across runtimes.

Implemented:
- job queue names and job payload contracts
- API/dashboard view contracts
- blog document schema/types

Open work:
- continue moving runtime contracts out of API-owned code as worker decoupling progresses

### Backend Core (`packages/backend-core`)
Stage: implemented and used as the first shared backend extraction.

Implemented:
- shared Prisma service
- shared structured logger
- shared security-event repository/service and runtime config token

Open work:
- continue moving worker-safe backend infrastructure and domain helpers here as worker decoupling progresses

### Shared Config (`packages/shared-config`)
Stage: implemented and used with a real `dist/` package layout.

Implemented:
- shared env readers
- signed service-token helpers
- shared ESLint presets
- shared TS base config

### Docker Infra (`infra/docker`)
Stage: implemented and running locally.

Implemented:
- base/local/staginglike Compose layouts
- Postgres, Redis, MinIO, API, worker, dashboard, migrate services
- local runtime bootstrap and port wiring
- Compose smoke-check automation via `make smoke-docker`

### Terraform Infra (`infra/terraform`)
Stage: partially implemented.

Implemented:
- AWS provider setup
- storage bucket module
- storage IAM user module
- shared tagging/context module

Open work:
- extend Terraform beyond storage to cover the actual deployment surface where desired:
  - managed Postgres / Redis strategy documentation or modules
  - Render/Vercel/Sentry integration strategy or explicit non-Terraform rationale
- add example `tfvars` and environment usage docs if Terraform remains part of the main ops path

## Prioritized Backlog

### Do First
No open backlog items after the typed exception cleanup and auth/ownership/ops/dashboard test coverage pass.

### Do Next
- Continue worker decoupling from API source internals.
  - Current state: the first shared extraction is done via `@aicp/backend-core`, but `apps/worker/src/worker.module.ts` and several processors still import many providers directly from `apps/api/src/...`
  - Target: move the next worker-safe domain services, queue contracts, and provider interfaces into shared packages or worker-owned modules.
  - Why first: this remains the highest-impact architecture boundary and it blocks cleaner worker evolution.

- Continue moving remaining runtime contracts out of API-owned code as worker decoupling progresses.
  - Why next: this is the lowest-risk way to reduce worker/API coupling before deeper structural changes.

- Add integration coverage for publish, discovery, and recovery flows executed through BullMQ workers.
  - Why next: once worker boundaries move, these flows need end-to-end protection.

- Add integration coverage for auth, ownership, publish retry, and ops endpoints at the API transport layer.
  - Why next: transport-level regression coverage should follow the worker decoupling pass.

### Do Later
- Tighten API-side failure responses so remaining generic service errors never leak as raw `500` payloads.

- Extend Terraform beyond storage to cover the actual deployment surface where desired:
  - managed Postgres / Redis strategy documentation or modules
  - Render/Vercel/Sentry integration strategy or explicit non-Terraform rationale

- Add example `tfvars` and environment usage docs if Terraform remains part of the main ops path.

### No Current Action
- Security
  - No open backlog items in this section after the latest hardening pass.

- Validation
  - No open backlog items captured separately. Add work here only if new DTO/schema or upload validation gaps appear.

- External Integrations
  - No open backlog items captured separately. Add adapter/provider issues here if new channel/API gaps are found.

- Storage/Assets
  - No open backlog items captured separately. Banner-image and upload flows are implemented.

- CI/CD
  - No open backlog items captured separately. Add CI-specific items here if deployment or pipeline gaps appear.

- Documentation
  - No open backlog items in this section after the auth-config doc cleanup and stage-map refresh.
