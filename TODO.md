# TODO - AI Content Pipeline

## Current Workstreams

### UI and UX Changes
- [x] Make the dashboard mobile friendly across overview, topics, topic detail pages, analytics, ops, and sign-in.
- [x] Audit all dashboard breakpoints and fix overflow, stretched cards, clipped code blocks, and stacked form actions on small screens.
- [x] Verify mobile navigation behavior for signed-in and signed-out states.
- [x] Verify touch-friendly spacing, button sizing, and readable type scale on narrow screens.

### Code Structure and Linting
- [x] Audit the repo for files that exceed `100` lines and refactor them down where practical.
- [x] Split any file that mixes transport, business logic, persistence, and external IO into focused layers.
- [x] Re-run the code-shape audit after refactors and record remaining intentional exceptions, if any.
- [x] Update lint tooling to enforce the structure rule set for file length and mixed-responsibility violations.
- [x] Add lint or CI checks that fail when the structure rules regress.

### Documentation and Cleanup
- [x] Update README and docs to match the latest code after the mobile/UI and code-structure refactors.
- [x] Remove stale or unwanted files that no longer reflect the implemented system.
- [x] Recheck local runbooks and command docs after cleanup.

### Runtime Verification
- [x] Verify every service still runs after the refactors: Postgres, Redis, MinIO, migrate, API, worker, and dashboard.
- [x] Re-run API, worker, and dashboard smoke checks after the refactors.
- [x] Fix any runtime breakage found during verification before closing the workstream.

## Current Workstream: Discovery Flow and Runtime Verification
- [x] Implement Topic Discovery manual intake -> scoring/filtering flow.
- [x] Implement Topic Discovery API-backed import agent -> scoring/filtering flow.
- [x] Verify Docker local runtime for API, worker, dashboard, Postgres, Redis, and MinIO.
- [x] Verify host-process runtime for API, worker, and dashboard on alternate ports.
- [x] Document step-by-step commands for Docker and non-Docker startup plus the API-triggered flow handoff chain.

## Phase 1: Core Pipeline Completion
- [x] Add Outline module (`apps/api/src/modules/outline`) with DB models, endpoints, and BullMQ jobs.
- [x] Replace draft placeholder section plan with real outline-section reads.
- [x] Add Workflow module to centralize state transitions and transition guards.
- [x] Add auth + RBAC guards (`EDITOR`, `REVIEWER`, `ADMIN`) for API endpoints.
- [x] Add global exception filter and structured logger/interceptors in API.
- [x] Add idempotency checks for all queue-enqueue endpoints (topic/research/draft/revision).

## Data and Migrations
- [x] Reconcile `schema.prisma` with `migration.sql` (single source of truth).
- [x] Generate complete Prisma migrations for all implemented models and validate drift against the committed SQL.
- [x] Add migration validation step in CI (`prisma validate` + `prisma migrate diff/check`).

## Worker Reliability
- [x] Add failed-job handling policy (dead-letter strategy + retry classification).
- [x] Add worker metrics/telemetry (queue lag, success/failure rate, retry counts).
- [x] Add manual replay/requeue tooling for failed jobs.

## Dashboard Implementation
- [x] Build API client layer (`apps/dashboard/src/lib/api-client.ts`) with typed responses.
- [x] Implement Topics list/create page.
- [x] Implement Topic detail pages: research, outline, draft, review, revisions.
- [x] Implement revision diff view.
- [x] Implement publish/history placeholders (even before full publish backend).
- [x] Add dashboard auth integration.

## Testing and Quality
- [x] Replace placeholder test scripts with real test runner (Jest or Vitest).
- [x] Convert existing `it.todo` tests to executable unit tests.
- [x] Implement e2e test for section-only revision guarantee.
- [x] Add integration tests for critical state transitions and approval gates.
- [x] Add lint configuration (shared config package + workspace lint scripts).

## Publishing and Distribution (Phase 2)
- [x] Implement SEO metadata service and queue job.
- [x] Implement Dev.to publish service + persistence (`publications`, `publication_attempts`).
- [x] Implement LinkedIn social draft generation flow.
- [x] Add publish and social endpoints to API and dashboard actions.

## Analytics and Discovery (Phase 3)
- [x] Add LLM usage rollup jobs and analytics endpoints.
- [x] Add analytics dashboard page and charts.
- [x] Add topic discovery suggestion module (initial heuristic version).

## Infra and Deployment Hardening
- [x] Add staging Render manifests or environment overlays.
- [x] Add Sentry release workflow and environment tagging.
- [x] Add branch protection + required checks policy.
- [x] Add production-ready health/readiness checks that include DB/Redis connectivity.
- [x] Remove `.DS_Store` and add `.gitignore` entries to prevent re-adding.

## Shared Packages
- [x] Populate `packages/shared-types` with exported DTO/event contracts from API modules.
- [x] Populate `packages/shared-config` with real eslint/tsconfig presets.

## Nice-to-Have
- [x] Add `make doctor` target for env/dependency/infra readiness checks.
- [x] Add seed scripts for local demo data.

## Note
- All backlog items below are implemented in code and the committed Prisma migration has been applied successfully against the local Docker PostgreSQL bootstrap path.

## Documentation-Derived Backlog

### Architecture Alignment
- [x] Introduce a canonical `content_items` model and `ContentState` enum so lifecycle state is tracked separately from raw topic intake, as described in `docs/stage-1-*` and `docs/stage-2-*`.
- [x] Add `workflow_events` and `workflow_runs` tables and move workflow auditing to the workflow module as the single transition ledger.
- [x] Refactor queues to match the documented split: `content.pipeline`, `publishing`, `social`, and `analytics`, instead of routing every job through one queue.
- [x] Add publish locking and approved-version pinning (`locked_for_publish`, latest-version guard) so publication always targets an explicit approved artifact version.

### Data Model Completion
- [x] Normalize social output into `social_posts` and `social_post_versions` tables instead of storing LinkedIn drafts only as generic artifact payloads.
- [x] Add normalized SEO metadata persistence (`slug`, `meta_title`, `meta_description`, `canonical_url`, tags array) instead of storing SEO only as free-form artifact JSON.
- [x] Add `content_item_id` linkage across analytics, publications, and workflow records to align with the documented schema.
- [x] Add `workflow_events`-based audit coverage for approvals, publish actions, and replay/retry actions.

### API Surface Completion
- [x] Add `GET /api/v1/topics/:topicId/draft/sections/:sectionKey` to support section-focused review/editor flows from the documented API design.
- [x] Add `PATCH /api/v1/reviews/:reviewId/comments/:commentId` for comment status and resolution updates.
- [x] Add `PATCH /api/v1/social-posts/:id/status` for manual LinkedIn approval/posting state changes.
- [x] Add dedicated analytics overview endpoints for throughput, lead time, revision rate, and publish cadence beyond raw LLM usage.

### Dashboard Maturity
- [x] Replace read-only draft and review pages with actual editor/reviewer actions for comments, resolution state, and revision submission.
- [x] Add section-focused review UI that loads one section at a time and uses the documented `section_key` workflow end to end.
- [x] Add social approval controls in the dashboard for LinkedIn draft lifecycle (`DRAFT`, `APPROVED`, `POSTED`).
- [x] Add feature flags around phase-2 and phase-3 screens/jobs so unfinished modules can be toggled safely in staging and production.
- [x] Replace header-based dashboard auth fallback with real NextAuth or SSO-backed sign-in aligned with the security baseline in `docs/stage-3-*`.

### Publishing and Distribution
- [x] Add publisher abstraction so new channels can be added without hard-coding Dev.to-specific logic into the publish flow.
- [x] Add storage-backed asset handling via S3/R2 for future images, exports, and platform attachments.
- [x] Add publication smoke tests and post-publish verification hooks in the deploy/publish path.

### Analytics and Discovery
- [x] Expand analytics rollups to include cycle time, revision counts, approval latency, and publish cadence as documented in Stage 1.
- [x] Evolve topic discovery from heuristic keyword frequency to trend-aware and internal-history-aware suggestions.

### Infra and Delivery
- [x] Add a Docker Compose migration/bootstrap step so schema setup is part of local bring-up, not a manual follow-up.
- [x] Add staging-like Docker Compose profile(s) for closer local parity with separated API, worker, and dashboard runtime concerns.
- [x] Add actual smoke-test steps to `deploy-api-worker.yml` before firing Render deploy hooks, as described in `docs/stage-3-*`.
- [x] Add environment-specific Vercel project/deploy configuration for preview, staging, and production instead of relying only on a single production deploy workflow.
- [x] Populate `infra/terraform` with at least starter IaC modules or a concrete README for managed Postgres, Redis, Render, Vercel, and storage provisioning.

### Production Readiness
- [x] Apply the generated Prisma migration against a live PostgreSQL instance and record the bootstrap procedure in README.
- [x] Replace remaining local-dev auth bypass behavior with explicit environment-gated security rules and failure-safe defaults.
- [x] Add worker-facing metrics export or push-based telemetry if queue metrics need to be scraped outside the API process.
