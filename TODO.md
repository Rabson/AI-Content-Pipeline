# TODO - AI Content Pipeline

Status: strict 10/10 modular-monolith + microservice-readiness P0 checklist (2026-03-09).

## P0 Checklist (Required for 10/10)

1. Decouple worker from API Prisma schema path.
Definition of done: worker build/runtime no longer references `apps/api/src/prisma/schema.prisma`; schema/client generation is owned by a shared data package (or worker-local schema contract) with versioned interface.
Verification: `rg -n "apps/api/src/prisma/schema.prisma" apps/worker infra apps -g '!apps/api/**'` returns no runtime/build dependency for worker paths.

2. Enforce service-level database ownership boundaries.
Definition of done: each domain/service has explicit table ownership and write ownership; cross-domain writes are removed or routed through API contracts/events.
Verification: ownership map committed + architecture tests fail on forbidden cross-domain repository writes.

3. Make worker independently releasable from API source tree.
Definition of done: worker Docker/Render build succeeds without requiring API source imports or API package aliasing; only package contracts + HTTP internal routes are used.
Verification: worker CI smoke build runs in isolation and passes; deployment manifest has no API source build dependency.

4. Freeze and enforce compatibility policy for internal contracts.
Definition of done: version compatibility matrix for queue payloads and internal worker routes is documented and CI-enforced (breaking change requires version bump + test update).
Verification: CI fails when contract version is changed without compatibility updates.

5. Execute one real service carve-out behind existing contracts (pilot extraction).
Definition of done: one candidate service (Research) runs as a separate deployable unit behind existing queue/API contracts with rollback path documented and tested.
Verification: staging flow runs end-to-end with extracted service; rollback drill passes.

6. Add release readiness gates per deployable service.
Definition of done: API, worker, dashboard each have independent health, smoke, rollback, and compatibility checks in CI/CD promotion flow.
Verification: per-service promotion pipeline can pass/fail independently with no global deploy requirement.

## P1 Checklist (Production Hardening)

1. Add end-to-end workflow invariant tests.
Definition of done: E2E tests enforce no-publish-before-approval, section-only revisions, immutable artifact versions, and valid state transitions.
Verification: CI fails on any invariant breach.

2. Add consumer-driven contract tests.
Definition of done: dashboard->api and worker->api transport contracts are validated in CI against contract fixtures/version matrix.
Verification: incompatible transport changes fail CI before merge.

3. Add expand/contract migration policy checks.
Definition of done: schema change workflow enforces backward-compatible migration sequence (expand -> dual-read/write if needed -> contract).
Verification: migration guard job blocks unsafe/breaking migration patterns.

4. Automate backup/restore drills.
Definition of done: scheduled Postgres backup restore validation runs and reports success/failure with documented RTO/RPO.
Verification: periodic restore drill evidence is available and alerts on failure.

5. Add secret rotation runbook and validation.
Definition of done: documented and tested rotation for internal JWT secrets and publisher token encryption keys (including key version rollover).
Verification: staged rotation test passes without breaking auth/publish flows.

6. Add OpenAI cost guardrails.
Definition of done: per-stage spend budgets and token ceilings enforced with alerting and optional fail-safe throttles.
Verification: budget breach triggers alerts and policy-defined handling.
