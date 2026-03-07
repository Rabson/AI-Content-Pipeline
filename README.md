# AI Content Pipeline

Internal AI-powered content operations system for topic-to-publication workflows.

![Full Flow Architecture](docs/architecture-full-flow.svg)

## Requirements
- Node.js `>=20`
- npm `>=10`
- PostgreSQL `>=16`
- Redis `>=7`
- Docker + Docker Compose for local infra/bootstrap
- OpenAI API key
- Dev.to API key for live publishing
- S3 or Cloudflare R2 credentials for asset upload flow

## Stack
- Frontend: Next.js dashboard on Vercel
- API: NestJS + Prisma + PostgreSQL on Render
- Worker: NestJS + BullMQ background worker on Render
- Queues:
  - `content.pipeline`: research, outline, draft, revision, SEO
  - `publishing`: Dev.to and future publisher adapters
  - `social`: LinkedIn generation and social lifecycle
  - `analytics`: daily rollups and lifecycle metrics
- Storage: S3/R2-compatible object storage
- Monitoring: Sentry + workflow/job telemetry + worker metrics endpoint

## Monorepo
- `apps/api`: NestJS HTTP API
- `apps/worker`: NestJS BullMQ worker runtime
- `apps/dashboard`: Next.js dashboard with NextAuth sign-in
- `packages/shared-types`: shared API/job types
- `packages/shared-config`: shared env + lint presets
- `infra/docker`: local Docker Compose files
- `infra/render`: Render manifests
- `infra/terraform`: starter IaC surface
- `docs`: staged architecture/design docs

## Core Data Model
- `topics`: intake objects for manually-created ideas
- `content_items`: canonical lifecycle state for each topic after intake
- `workflow_runs` / `workflow_events`: transition ledger and operational audit trail
- `research_artifacts`, `outlines`, `draft_versions`, `draft_sections`, `review_comments`, `revision_runs`
- `seo_metadata`: normalized SEO persistence
- `social_posts`, `social_post_versions`: normalized social persistence
- `publications`, `publication_attempts`: pinned publish ledger
- `llm_usage_logs`, `analytics_daily_usage`, `analytics_daily_overview`
- `storage_objects`: S3/R2-backed asset records

## Auth and Security
- Dashboard uses NextAuth credentials-based sign-in.
- API auth bypass is only allowed when both are true:
  - `APP_ENV=local`
  - `AUTH_ALLOW_HEADER_BYPASS=true`
- In staging/production, the API fails closed unless user identity headers are supplied by a trusted caller.
- Dashboard feature flags:
  - `NEXT_PUBLIC_FEATURE_PHASE2_ENABLED`
  - `NEXT_PUBLIC_FEATURE_PHASE3_ENABLED`
- API/worker feature flags:
  - `FEATURE_PHASE2_ENABLED`
  - `FEATURE_PHASE3_ENABLED`

## Services

### Topic Service
- Manual topic creation
- Scoring, approval/rejection
- Topic intake state
- Handoff into research

### Workflow Service
- Canonical `content_items` lifecycle state
- Central transition guard
- `workflow_runs` and `workflow_events`
- Audit coverage for approvals, publish actions, and replays

### Research Service
- Takes approved topic
- Gathers/normalizes source material
- Calls OpenAI for structured research JSON
- Stores sources, key points, examples, summary

### Outline Service
- Produces ordered section plan from research
- Stores section keys/objectives/target words

### Draft Service
- Section-by-section markdown generation only
- Immutable draft versions
- Review sessions/comments tied to sections
- `GET /api/v1/topics/:topicId/draft/sections/:sectionKey`

### Revision Service
- Section-level revisions only
- New draft version per revision run
- Per-section diff storage

### SEO Service
- Generates normalized SEO metadata
- Persists `slug`, `meta_title`, `meta_description`, `canonical_url`, tags, keywords

### Social Service
- Generates LinkedIn drafts
- Persists `social_posts` + immutable `social_post_versions`
- Manual social lifecycle updates via status endpoint

### Publisher Service
- Publisher adapter registry
- Dev.to adapter implemented
- Pinned approved draft version required for publication
- Publish locking and verification hook

### Analytics Service
- Daily LLM usage rollups
- Lifecycle overview rollups: throughput, lead time, revision rate, approval latency, publish cadence
- Per-content metrics endpoint

### Discovery Service
- Manual discovery intake and queued provider import
- Candidate listing and suggestion generation
- Automatic heuristic scoring/filtering for discovered topics

### Storage Service
- S3/R2 presigned upload URLs
- Persists `storage_objects`
- Intended for images, exports, and publication attachments

## Dashboard
- Routes:
  - `/`: overview
  - `/topics`: topic queue and detail flows
  - `/analytics`: lifecycle and LLM usage
  - `/ops`: admin-only runtime, queue, and failed-job view
- Shared dashboard layout is tuned for narrow/mobile widths:
  - header actions wrap cleanly
  - topic sub-navigation scrolls horizontally instead of clipping
  - form actions stack on small screens
  - cards size to their own content instead of stretching to adjacent rows
- Local seeded identities:
  - `ADMIN`: `operator@example.com` / `local-access`
  - `REVIEWER`: `reviewer@example.com` / `local-access`
  - `EDITOR`: `editor@example.com` / `local-access`
- The API receives dashboard-authenticated requests with:
  - `x-actor-id`
  - `x-actor-role`
  - `x-user-email`

## Worker Runtime
- Entry: `apps/worker/src/main.ts`
- Exposes optional metrics/health server when `WORKER_METRICS_PORT` is set
  - `GET /health`
  - `GET /ready`
  - `GET /metrics`
- Processors:
  - `discovery.import`
  - `research.run`
  - `outline.generate`
  - `draft.generate.*`
  - `revision.apply.*`
  - `seo.generate`
  - `social.linkedin.generate`
  - `publish.devto`
  - `analytics.rollup.daily`

## Environment Variables
Runtime reads `.env` only. `.env.example` is a key-only template.

### Shared
- `APP_ENV`
- `NODE_ENV`
- `QUEUE_PREFIX`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `AUTH_ALLOW_HEADER_BYPASS`
- `FEATURE_PHASE2_ENABLED`
- `FEATURE_PHASE3_ENABLED`
- `DISCOVERY_HN_API_BASE_URL`
- `OTEL_ENABLED`
- `OTEL_SERVICE_NAMESPACE`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `OTEL_LOG_LEVEL`

### API / Worker
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_RESEARCH`
- `OPENAI_MODEL_DRAFT`
- `DEVTO_API_KEY`
- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `STORAGE_ENDPOINT`
- `STORAGE_PUBLIC_BASE_URL`
- `STORAGE_FORCE_PATH_STYLE`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `WORKER_METRICS_PORT`

### Dashboard / NextAuth
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_FEATURE_PHASE2_ENABLED`
- `NEXT_PUBLIC_FEATURE_PHASE3_ENABLED`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DASHBOARD_ACCESS_CODE`
- `AUTH_ALLOWED_EMAIL_DOMAINS`
- `AUTH_ADMIN_EMAILS`
- `AUTH_REVIEWER_EMAILS`

### Local seeded dashboard identities
- `ADMIN`: `operator@example.com` + `local-access`
- `REVIEWER`: `reviewer@example.com` + `local-access`
- `EDITOR`: `editor@example.com` + `local-access`
- The editor role is the fallback for any allowed-domain email not listed as admin or reviewer.

## Commands
Use `make` for the normal workflow.

### Bootstrap
- `make install`
- `make prisma-generate`
- `make doctor`

### Local Runtime
- `make dev-up`
  - Starts Postgres, Redis, MinIO, migration bootstrap, API, worker, dashboard
- `make dev-down`
- `make dev-up-staginglike`
  - Uses `infra/docker/docker-compose.staginglike.yml` overrides for closer staging parity
- `make dev-down-staginglike`
- `make dev-logs`
- `make dev-ps`

### Direct Dev Processes
- `make dev-api`
- `make dev-worker`
- `make dev-dashboard`

### Prisma
- `make prisma-generate`
- `make prisma-migrate-dev NAME=your_migration`
- `make prisma-migrate-deploy`
- `make prisma-studio`

### Quality
- `make typecheck`
- `make lint`
- `make test`
- `make check`
- `npm run lint:structure`
  - repo-level code shape enforcement
  - `100` line ceiling for source files unless explicitly excepted
  - layer-mixing checks for controller/repository/service boundaries
  - rule details: `docs/code-shape-rules.md`

### Build
- `make build-api`
- `make build-worker`
- `make build-dashboard`
- `make build-all`

### Utility
- `make health-api`
- `make health-worker`
- `make seed-demo`
- `make clean`

## Verified Docker Runtime
Verified on March 7, 2026 against the current code:
- `postgres`, `redis`, `minio`, `api`, `worker`, `dashboard` containers are up
- `migrate` exits successfully after applying Prisma migrations
- API returns `200` for:
  - `/api/health`
  - `/api/ready`
  - `/api/v1/topics`
  - `/api/v1/discovery/candidates`
  - `/api/v1/ops/runtime-status`
- Worker returns `200` for:
  - `/health`
  - `/ready`
  - `/metrics`
- Dashboard returns `200` for:
  - `/`
  - `/topics`
  - `/analytics`
  - `/ops`
- Root `npm run lint` also passes and now includes `scripts/check-code-shape.mjs`

## Local Setup
1. Create `.env` once from `.env.example` if it does not exist.
2. Set secrets and overrides in `.env`:
   - `OPENAI_API_KEY`
   - `DEVTO_API_KEY` if publishing live
   - storage credentials for S3/R2 if testing uploads
   - `NEXTAUTH_SECRET`
   - `DASHBOARD_ACCESS_CODE`
   - `OTEL_*` values if you are shipping traces to an OTLP collector
3. `make install`
4. `make prisma-generate`
5. `make dev-up`
6. Open dashboard at `http://localhost:3003`
7. Sign in with an allowed email and the configured dashboard access code
8. If the dashboard ever serves stale Next assets locally, run `make clean` and restart the stack

## Docker Compose
- Base local stack: `infra/docker/docker-compose.yml`
- Staging-like override: `infra/docker/docker-compose.staginglike.yml`
- The `migrate` service runs `prisma migrate deploy` before API/worker start.
- Detailed local runbook and discovery trigger flow: `docs/local-runtime-and-discovery-flow.md`
- Docker startup and verification commands: `docs/docker-local-commands.md`

## Database and Migration Workflow
- Schema: `apps/api/src/prisma/schema.prisma`
- Committed migration: `apps/api/src/prisma/migrations/202603070001_init/migration.sql`
- Regenerate from schema:
  - `DATABASE_URL=... npx prisma migrate diff --from-empty --to-schema-datamodel apps/api/src/prisma/schema.prisma --script > apps/api/src/prisma/migrations/202603070001_init/migration.sql`
- Apply to a live database:
  - `make prisma-migrate-deploy`
- Verified local bootstrap procedure:
  - `docker compose --env-file .env -f infra/docker/docker-compose.yml up -d postgres`
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_content_pipeline npx prisma migrate deploy --schema apps/api/src/prisma/schema.prisma`
  - or run `docker compose --env-file .env -f infra/docker/docker-compose.yml up migrate` to execute the migration container directly against the local Postgres service

## API Quick Reference

### Topic
- `POST /api/v1/topics`
- `GET /api/v1/topics`
- `GET /api/v1/topics/:id`
- `PATCH /api/v1/topics/:id`
- `POST /api/v1/topics/:id/submit`
- `POST /api/v1/topics/:id/score`
- `POST /api/v1/topics/:id/approve`
- `POST /api/v1/topics/:id/reject`
- `POST /api/v1/topics/:id/handoff-research`

### Discovery
- `GET /api/v1/discovery/suggestions`
- `GET /api/v1/discovery/candidates`
- `POST /api/v1/discovery/topics/manual`
- `POST /api/v1/discovery/topics/import`

### Workflow
- `GET /api/v1/topics/:topicId/workflow/events`
- `GET /api/v1/topics/:topicId/workflow/runs`

### System and Ops
- `GET /api/health`
- `GET /api/ready`
- `GET /api/v1/ops/runtime-status`
- `GET /api/v1/ops/queue-metrics`
- `GET /api/v1/ops/failed-jobs`
- `POST /api/v1/ops/failed-jobs/:executionId/replay`

### Research
- `POST /api/v1/topics/:topicId/research/run`
- `GET /api/v1/topics/:topicId/research`
- `GET /api/v1/topics/:topicId/research/versions`
- `POST /api/v1/topics/:topicId/research/sources`

### Outline
- `POST /api/v1/topics/:topicId/outline/generate`
- `GET /api/v1/topics/:topicId/outline`

### Draft and Review
- `POST /api/v1/topics/:topicId/drafts/generate`
- `GET /api/v1/topics/:topicId/drafts`
- `GET /api/v1/topics/:topicId/drafts/current`
- `GET /api/v1/topics/:topicId/drafts/current/markdown`
- `GET /api/v1/topics/:topicId/draft/sections/:sectionKey`
- `POST /api/v1/drafts/:draftVersionId/reviews`
- `POST /api/v1/reviews/:reviewSessionId/comments`
- `PATCH /api/v1/reviews/:reviewSessionId/comments/:commentId`
- `POST /api/v1/reviews/:reviewSessionId/submit`
- `POST /api/v1/drafts/:draftVersionId/approve`

### Revision
- `POST /api/v1/reviews/:reviewSessionId/revisions/run`
- `GET /api/v1/topics/:topicId/revisions`
- `GET /api/v1/revisions/:revisionRunId`
- `GET /api/v1/revisions/:revisionRunId/diff`
- `GET /api/v1/topics/:topicId/drafts/compare`

### SEO, Social, Publish, Storage, Analytics
- `POST /api/v1/topics/:topicId/seo/generate`
- `GET /api/v1/topics/:topicId/seo`
- `POST /api/v1/topics/:topicId/social/linkedin/generate`
- `GET /api/v1/topics/:topicId/social/linkedin`
- `PATCH /api/v1/social-posts/:id/status`
- `POST /api/v1/topics/:topicId/publications/devto`
- `GET /api/v1/topics/:topicId/publications`
- `POST /api/v1/topics/:topicId/assets/presign-upload`
- `POST /api/v1/analytics/llm-usage/rollup`
- `GET /api/v1/analytics/llm-usage`
- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/topics/:contentItemId`
- `GET /api/v1/discovery/suggestions`

## LLM vs Human Workflow

### LLM takes over
- Research synthesis after approval/handoff
- Outline generation from research
- Draft generation section-by-section
- Revision generation section-by-section only
- SEO metadata generation
- LinkedIn draft generation

### Human interaction required
- Manual topic creation and scoping
- Topic scoring review and final approve/reject decision
- Review comments mapped to explicit draft sections
- Comment resolution decisions
- Choosing revision instructions per section
- Final draft approval before publish
- Social approval/post status updates
- Publish confirmation and external verification checks

## CI/CD
- `ci.yml`: lint, typecheck, test, Prisma validation/drift check
- `deploy-api-worker.yml`:
  - boots Postgres + Redis service containers
  - applies Prisma migrations
  - lints, typechecks, tests, builds
  - smoke-tests API and worker health endpoints
  - triggers Render deploy hooks
- `deploy-dashboard.yml`:
  - PR preview deploys
  - `staging` branch deploys to staging Vercel project
  - `main` deploys to production Vercel project
- `sentry-release.yml`: Sentry release tagging

## Code Shape
- Enforcement script: `scripts/check-code-shape.mjs`
- Reviewed exceptions: `config/code-shape-exceptions.json`
- Current enforced rules:
  - controllers must not reach into Prisma, queue wiring, or direct external IO
  - repositories must not perform queue work or external IO
  - service-like files must not combine direct `PrismaService` access with queue wiring or direct external IO
  - source files over `100` lines must be explicitly excepted

## Infra Files
- `infra/render/render-api.yaml`
- `infra/render/render-worker.yaml`
- `infra/render/render-api.staging.yaml`
- `infra/render/render-worker.staging.yaml`
- `apps/dashboard/vercel.json`
- `infra/terraform/README.md`

## Current Note
- The committed migration is regenerated from schema and ready to apply.
- Live migration application still depends on a reachable PostgreSQL instance. If you run `make dev-up` or point `DATABASE_URL` at a live database, `make prisma-migrate-deploy` applies it.
- Health/readiness endpoints now cover DB, Redis, Bull queues, and telemetry state.
- OpenTelemetry is wired into API and worker bootstrap; enable it by setting `OTEL_ENABLED=true` and a valid OTLP HTTP endpoint in `.env`.
