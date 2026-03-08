# Codebase Handover

This document is for a new engineer taking over the repo.
It explains how the code is organized, how the main flows move through the system, and where to look first when debugging or extending behavior.

## 1. Mental Model

Treat the repo as a modular monolith with three deployable apps and a small set of shared packages.

- `apps/api`
  - synchronous entrypoint
  - owns HTTP transport, auth, RBAC, request validation, orchestration entrypoints, and DB writes that happen on request
- `apps/worker`
  - asynchronous entrypoint
  - owns BullMQ consumers, long-running generation/publish flows, retry behavior, and worker health/metrics
- `apps/dashboard`
  - internal operator UI
  - owns sign-in, topic/research/draft/publish screens, and ops visibility
- `packages/shared-types`
  - queue names, queue payload contracts, API/view types, blog document contract
- `packages/shared-config`
  - env readers, service-token helpers, telemetry config/runtime helpers, shared lint/TS config
- `packages/backend-core`
  - first shared backend runtime package
  - currently owns Prisma service, structured logger, security-event repository/service, and redaction utilities

The important rule is:
- apps are deployable runtimes
- packages are shared code
- worker should move toward packages, not toward importing `apps/api/src/...`

## 2. What Lives Where

### API
Start here for request-driven behavior:
- bootstrap: `apps/api/src/main.ts`
- root wiring: `apps/api/src/app.module.ts`
- cross-cutting providers: `apps/api/src/common/common.module.ts`
- env: `apps/api/src/config/env.ts`

API modules follow a mostly stable pattern:
- `controller`
  - HTTP only
- `service`
  - orchestration or query facade
- `repository`
  - Prisma access
- `providers`
  - external IO or specialized logic
- `dto`
  - request validation

### Worker
Start here for async flows:
- bootstrap: `apps/worker/src/main.ts`
- DI wiring: `apps/worker/src/worker.module.ts`
- processors: `apps/worker/src/processors/*`
- worker env: `apps/worker/src/config/env.ts`
- worker support: `apps/worker/src/support/*`

The worker is still the main architecture hotspot because many orchestrators/repositories are imported from API-owned code.
The current refactor path is to extract worker-safe pieces into packages.

### Dashboard
Start here for operator behavior:
- app shell: `apps/dashboard/src/app/layout.tsx`
- shared shell/chrome: `apps/dashboard/src/components/shared/dashboard-shell.tsx`
- auth/session helpers: `apps/dashboard/src/lib/auth*`
- API clients: `apps/dashboard/src/lib/api-client/*`
- env: `apps/dashboard/src/config/env.ts`

### Shared packages
- queue and API contracts: `packages/shared-types/src/*`
- env/security/telemetry helpers: `packages/shared-config/*`
- backend runtime primitives: `packages/backend-core/src/*`

## 3. Primary Business Flow

The main content flow is:
1. Topic intake/discovery
2. Topic scoring and approval
3. Research generation
4. Outline generation
5. Draft generation by section
6. Section-level review and revision
7. SEO/social generation
8. Publish to external channels

### Topic intake
Main files:
- `apps/api/src/modules/topic/*`
- `apps/api/src/modules/discovery/*`

Flow:
- dashboard or API caller hits topic/discovery controller
- service validates intent and status transition
- repository persists topic and status history
- research handoff enqueues BullMQ job

### Research / Outline / Draft / Revision
Main files:
- `apps/api/src/modules/research/*`
- `apps/api/src/modules/outline/*`
- `apps/api/src/modules/draft/*`
- `apps/api/src/modules/revision/*`
- `apps/worker/src/processors/content-pipeline.processor.ts`

Pattern:
- API creates/enqueues work
- worker processor receives queue job
- orchestrator runs domain flow
- repository persists artifact/version/status
- provider talks to OpenAI or external source

The content stages are versioned and section-based.
That is the key mental model for edits:
- drafts are immutable versions
- revisions touch sections, not whole posts
- review comments map to sections

### Publish
Main files:
- `apps/api/src/modules/publisher/*`
- `apps/api/src/modules/user/*`
- `apps/worker/src/processors/publish.processor.ts`

Flow:
- approved content is assigned to a `USER` owner
- owner stores channel credentials in account settings
- publish request is validated in API
- worker resolves encrypted credentials and calls channel adapter
- result is stored as publication history / failure state

## 4. State Boundaries

### PostgreSQL
Persistent source of truth:
- topics and workflow state
- research/outline/draft/revision artifacts
- users, credentials, ownership
- publication history
- analytics rollups and security events

### Redis / BullMQ
Ephemeral execution layer:
- queue state
- retries/backoff
- worker handoff between stages

### Object storage
Persistent blob storage:
- banner images and uploaded assets

### Dashboard session
Operator/browser state:
- login session
- theme preference

## 5. How To Trace a Request

### Synchronous HTTP path
Use this order:
1. controller
2. service
3. repository
4. DTO / mapper / helper
5. Prisma model if needed

Example:
- publish action
  - `publisher.controller.ts`
  - `publisher.service.ts`
  - `publisher.repository.ts`
  - then workflow/topic ownership checks

### Async worker path
Use this order:
1. queue producer in API
2. queue name / payload in `packages/shared-types`
3. worker processor
4. orchestrator
5. repository / provider

Example:
- research run
  - API handoff endpoint
  - queue contract
  - `content-pipeline.processor.ts`
  - `research.orchestrator.ts`
  - `research.repository.ts`
  - OpenAI provider

## 6. Cross-Cutting Concerns

### Auth and RBAC
Start here:
- API guard: `apps/api/src/common/guards/auth.guard.ts`
- API roles guard: `apps/api/src/common/guards/roles.guard.ts`
- Casbin service: `apps/api/src/common/auth/casbin-authorization.service.ts`
- dashboard sign-in: `apps/dashboard/src/lib/auth-options.ts`

### Security events
Start here:
- `packages/backend-core/src/security/*`
- API wires runtime thresholds in `apps/api/src/common/common.module.ts`
- worker wires the same config in `apps/worker/src/worker.module.ts`

### Observability
Start here:
- telemetry runtime: `packages/shared-config/observability/*`
- API wrapper: `apps/api/src/common/observability/opentelemetry.ts`
- worker wrapper: `apps/worker/src/support/opentelemetry.ts`
- ops API: `apps/api/src/modules/ops/*`
- ops UI: `apps/dashboard/src/app/ops/*`

## 7. Current Architecture Debt

This is the next major refactor area:
- `apps/worker/src/worker.module.ts` still imports many API-owned repositories, orchestrators, and providers
- worker TS config still includes `../api/src/**/*.ts`

What has already been extracted:
- shared config and telemetry helpers
- shared queue/type contracts
- backend runtime primitives in `@aicp/backend-core`

What should be extracted next:
- worker-safe repositories/orchestrators/provider interfaces
- queue-oriented domain services used by both API and worker

## 8. Safe Change Strategy

When changing behavior:
- prefer package extraction over cross-app imports
- keep controllers thin
- keep repositories DB-only
- keep providers external-IO-only
- keep orchestrators stage-focused

When debugging:
- start from the runtime entrypoint actually handling the action
- do not start with Prisma schema unless the bug is clearly persistence-related
- do not start with the dashboard if the failure is in queue execution

## 9. Recommended Read Order for a New Engineer

1. `README.md`
2. `RUN.md`
3. `docs/README.md`
4. `apps/api/src/app.module.ts`
5. `apps/worker/src/worker.module.ts`
6. `apps/dashboard/src/app/layout.tsx`
7. `packages/shared-types/src/index.ts`
8. `packages/shared-config/package.json`
9. `packages/backend-core/src/index.ts`
10. one full feature vertically, in this order:
   - topic
   - research
   - draft
   - publish

## 10. High-Value Hotspots

If you only have time to understand a few places, use these:
- `apps/worker/src/worker.module.ts`
- `apps/api/src/modules/workflow/*`
- `apps/api/src/modules/publisher/*`
- `apps/api/src/modules/topic/*`
- `apps/dashboard/src/lib/api-client/*`
- `packages/shared-types/src/job-payloads/*`
- `packages/backend-core/src/*`

## 11. Current Rule of Thumb

Use this boundary rule when adding code:
- if both API and worker need it, package it
- if only API needs it, keep it in API
- if only worker needs it, keep it in worker
- if only UI needs it, keep it in dashboard

That rule is the fastest way to keep the codebase from drifting back into cross-app coupling.
