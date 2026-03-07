# Stage 3: Monorepo Structure, Infra, CI/CD, Deployment

## 1) Monorepo Structure

```text
AI-Content-Pipeline/
  apps/
    api/                  # NestJS API + render manifests + Dockerfile
    worker/               # NestJS BullMQ worker + render manifests + Dockerfile
    dashboard/            # Next.js dashboard + Dockerfile + Vercel config
  packages/
    shared-types/         # DTOs, enums, Zod schemas, blog document contract
    shared-config/        # TS env readers, ESLint presets, shared TS base config
  infra/
    docker/               # compose.base.yml, compose.local.yml, staginglike override
    terraform/            # optional IaC surface
  docs/
  .github/workflows/
```

### Module boundaries
- `apps/api` owns HTTP, auth, orchestration commands, and queue enqueueing.
- `apps/worker` owns async execution only.
- `apps/dashboard` owns operator UX and API-backed workflows only.
- `packages/shared-types` owns shared contracts.
- `packages/shared-config` owns toolchain-level shared config and env parsing helpers.
- No direct dashboard-to-database access; dashboard only calls API.

## 2) Infra Design

## Local (Docker Compose)
Compose files:
- `infra/docker/compose.base.yml`
- `infra/docker/compose.local.yml`
- `infra/docker/docker-compose.staginglike.yml`

Services:
- `postgres` (host port `5432`)
- `redis` (host port `6380`)
- `minio` (host ports `9000` and `9001`)
- `migrate` (API Dockerfile `migrate` target)
- `api` (host port `3001`)
- `worker` (host port `3002` for health/metrics)
- `dashboard` (host port `3003`)

Local flow:
1. `docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d postgres redis minio`
2. `docker compose ... up migrate`
3. `docker compose ... up -d api worker dashboard`
4. verify API, worker, and dashboard sign-in health endpoints

Container build ownership:
- `apps/api/Dockerfile` + `apps/api/Dockerfile.dockerignore`
- `apps/worker/Dockerfile` + `apps/worker/Dockerfile.dockerignore`
- `apps/dashboard/Dockerfile` + `apps/dashboard/Dockerfile.dockerignore`

## Staging
- Vercel project for dashboard staging deploys
- Render services:
  - `apps/api/render.staging.yaml`
  - `apps/worker/render.staging.yaml`
- Managed Postgres/Redis staging instances
- Optional staging-like local compose file for parity checks

## Production
- Vercel project for production dashboard deploys
- Render services:
  - `apps/api/render.yaml`
  - `apps/worker/render.yaml`
- Managed Postgres/Redis production
- S3/R2 bucket for assets
- Sentry DSN across all runtimes
- OpenTelemetry OTLP endpoint optional for traces

## 3) Environment Variables

## Shared runtime shape
- Root [`.env`](../.env) is the local runtime source
- Root scripts build `@aicp/shared-config` first, then inject `.env`
- Service-local env modules:
  - `apps/api/src/config/env.ts`
  - `apps/worker/src/config/env.ts`
  - `apps/dashboard/src/config/env.ts`

## API/Worker
- `DATABASE_URL`
- `REDIS_URL`
- `QUEUE_PREFIX`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_DRAFT`
- `OPENAI_MODEL_RESEARCH`
- `DEVTO_API_KEY`
- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `STORAGE_ENDPOINT`
- `STORAGE_PUBLIC_BASE_URL`
- `STORAGE_FORCE_PATH_STYLE`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `OTEL_ENABLED`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `OTEL_SERVICE_NAMESPACE`

## Dashboard
- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_API_BASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DASHBOARD_ACCESS_CODE`
- `AUTH_ALLOWED_EMAIL_DOMAINS`
- `AUTH_ADMIN_EMAILS`
- `AUTH_REVIEWER_EMAILS`
- `NEXT_PUBLIC_FEATURE_PHASE2_ENABLED`
- `NEXT_PUBLIC_FEATURE_PHASE3_ENABLED`

## 4) CI/CD Design (GitHub Actions)

## Workflow: `ci.yml`
Jobs:
1. workspace lint
2. structure lint
3. typecheck
4. tests
5. build validation

## Workflow: `deploy-dashboard.yml`
- dashboard deploy automation for Vercel targets
- branch-sensitive staging vs production behavior

## Workflow: `deploy-api-worker.yml`
- boot Postgres + Redis service containers
- apply Prisma migrations
- lint, typecheck, test, build
- smoke-test API and worker endpoints
- trigger Render deploy hooks

## Workflow: `migrate.yml`
- protected/manual migration execution path

## Workflow: `sentry-release.yml`
- release tracking for deployed revisions

## 5) Deployment Units
- `dashboard` -> Vercel
- `api` -> Render web service
- `worker` -> Render background worker
- Data -> managed Postgres + Redis
- Storage -> S3/R2

Rationale:
- API and worker scale independently.
- Dashboard stays isolated from database credentials.
- DB/Redis remain managed services for lower ops overhead.

## 6) Observability & Reliability Baseline
- Structured JSON logs with request/job correlation IDs
- Sentry for unhandled exceptions and performance traces
- `job_executions` table as operational ledger
- API health/readiness endpoints
- Worker `/health`, `/ready`, `/metrics`
- OpenTelemetry bootstrap in API and worker when `OTEL_ENABLED=true`
- LLM token + cost persisted in `llm_usage_logs`

## 7) Security Baseline
- NextAuth credentials sign-in for dashboard
- RBAC roles: `EDITOR`, `REVIEWER`, `ADMIN`
- API local bypass only when `APP_ENV=local` and `AUTH_ALLOW_HEADER_BYPASS=true`
- Secrets only in `.env` for local and provider secret stores for deployed environments
- Dev.to and OpenAI keys remain server-side only
- Audit trail in `workflow_events` for approval and publish actions
