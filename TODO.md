# TODO - AI Content Pipeline

Status: updated on 2026-03-09 after code + runtime validation.

## Validation Snapshot

Completed in this audit:

- `npm run prisma:generate` ✅
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅
- `npm run build:api` ✅
- `npm run build:worker` ✅
- `npm run build:dashboard` ✅
- `make smoke-docker` ✅ (`api`, `worker`, `dashboard`, `postgres`, `redis`, `minio` healthy)

## Missing by Service

### API (`apps/api`)

1. Expand transport-layer test coverage for controllers that currently have no dedicated controller/e2e spec:
   - `analytics`, `discovery`, `draft`, `outline`, `publisher`, `research`, `revision`, `seo`, `social`, `storage`, `system`, `auth`, `user-publisher-credential`, `user`, `workflow`.
2. Add end-to-end role/policy tests for publish ownership paths:
   - `USER` publish own topic
   - `ADMIN` publish on behalf
   - unauthorized owner reassignment/publish attempts.
3. Tighten error envelope consistency:
   - ensure API returns normalized structured errors for all validation/service failures.

### Worker (`apps/worker`)

1. Decouple worker from API source internals:
   - current state: `78` imports from `apps/api/src/...` across `worker.module.ts` and processors.
   - target: move reusable orchestration/repository/provider contracts into shared packages (`@aicp/*`) or worker-owned modules.
2. Add processor tests for all queue processors missing direct specs:
   - `analytics`, `content-pipeline`, `discovery`, `draft`, `outline`, `publish`, `research`, `revision`, `seo`, `social`.
3. Add BullMQ integration tests:
   - retry/backoff behavior
   - failed job recording
   - replay/recovery flows.

### Dashboard (`apps/dashboard`)

1. Add route-level page specs for currently untested routes:
   - `/`, `/topics`, `/topics/[topicId]`, `/topics/[topicId]/draft`, `/topics/[topicId]/history`, `/topics/[topicId]/outline`, `/topics/[topicId]/research`, `/topics/[topicId]/review`, `/topics/[topicId]/revisions`, `/analytics`, `/ops`.
2. Add auth/authorization integration tests:
   - redirect when unauthenticated
   - role-based access behavior on sensitive actions.
3. Add API-failure UI tests for major pages (topics, ops, analytics) to lock error-boundary and fallback rendering.

## Cross-Service / Platform Gaps

1. Security dependency backlog:
   - `npm audit --omit=dev` reports `9` vulnerabilities (`5 moderate`, `4 high`) in transitive deps; triage and pin/override safely.
2. Shared package test coverage:
   - `@aicp/auth-core`, `@aicp/backend-core`, `@aicp/observability-core`, `@aicp/queue-contracts`, `@aicp/shared-config`, `@aicp/workflow-core` have minimal or no tests.
3. CI hardening:
   - keep current lint/typecheck/test/build gates
   - add optional Docker smoke stage (`make smoke-docker`) for deploy pipelines where runtime parity is required.
4. Terraform completeness:
   - still storage-focused; decide whether to add managed DB/Redis + service infra modules or document non-Terraform ownership clearly.

## Priority Order

### Do First

0. Tighten error envelope consistency: ensure API returns normalized structured errors for all validation/service failures.
1. Worker decoupling from `apps/api/src/...`.
2. Worker processor and BullMQ integration tests.
3. API transport/e2e coverage for publish/auth/ownership flows.

### Do Next

1. Dashboard route + auth/failure integration tests.
2. Shared package tests.
3. Security dependency triage (`npm audit` findings).

### Do Later

1. CI Docker smoke stage expansion.
2. Terraform scope decision and completion.
