# Stage 3: Monorepo Structure, Infra, CI/CD, Deployment

## 1) Monorepo Structure

```text
AI-Content-Pipeline/
  apps/
    api/                  # NestJS API
    worker/               # NestJS BullMQ worker
    dashboard/            # Next.js admin dashboard
  packages/
    shared-types/         # DTOs, enums, zod schemas
    shared-config/        # eslint, tsconfig, env utilities
  infra/
    docker/               # local compose + dockerfiles
    render/               # render blueprints and service manifests
    terraform/            # optional IaC templates (later)
  docs/
  .github/workflows/
```

### Module boundaries
- `apps/api` owns HTTP, auth, orchestration commands.
- `apps/worker` owns async execution only.
- Shared contracts move to `packages/shared-types`.
- No direct dashboard-to-database access; dashboard only calls API.

## 2) Infra Design

## Local (Docker Compose)
Containers:
- `postgres` (port 5432)
- `redis` (port 6379)
- `api` (port 3001)
- `worker`
- `dashboard` (port 3000)

Local flow:
1. `docker compose up -d postgres redis`
2. run `api`, `worker`, `dashboard` in dev mode.
3. Prisma migrations against local Postgres.

## Staging
- Vercel project: `dashboard-staging`
- Render services:
  - `content-api-staging` (web)
  - `content-worker-staging` (worker)
- Managed Postgres/Redis staging instances.
- Feature branch previews on Vercel.

## Production
- Vercel project: `dashboard-prod`.
- Render services:
  - `content-api-prod`
  - `content-worker-prod`
- Managed Postgres/Redis production.
- S3/R2 bucket for assets.
- Sentry DSN across all runtimes.

## 3) Environment Variables

## Shared
- `NODE_ENV`
- `APP_ENV` (`local|staging|production`)
- `SENTRY_DSN`

## API/Worker
- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_DRAFT`
- `OPENAI_MODEL_RESEARCH`
- `DEVTO_API_KEY`
- `DEVTO_ORG_ID` (optional)
- `STORAGE_PROVIDER` (`s3|r2`)
- `STORAGE_BUCKET`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `WORKER_CONCURRENCY`
- `QUEUE_PREFIX`
- `INTERNAL_API_TOKEN` (api<->worker admin endpoints if needed)

## Dashboard
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXTAUTH_SECRET` (if using NextAuth)
- `AUTH_ALLOWED_EMAIL_DOMAINS`

## 4) CI/CD Design (GitHub Actions)

## Workflow: `ci.yml` (on PR + push)
Jobs:
1. `lint`
2. `typecheck`
3. `test`
4. `prisma-validate` (format + migration check)

Gate: deploy workflows run only if `ci.yml` passes on main.

## Workflow: `deploy-dashboard.yml`
- Trigger: push to `main` changes in `apps/dashboard/**`
- Action: Vercel deploy (preview on PR, production on main tag/branch)

## Workflow: `deploy-api-worker.yml`
- Trigger: push to `main` changes in `apps/api/**`, `apps/worker/**`, `packages/**`, `infra/**`
- Steps:
  1. build api image
  2. build worker image
  3. run smoke tests
  4. deploy to Render API service
  5. deploy to Render worker service

## Workflow: `migrate-prod.yml`
- Trigger: manual (`workflow_dispatch`) + protected environment approval
- Runs Prisma migrations with backup check and lock.

## 5) Deployment Units

- Unit A: `dashboard` (Vercel)
- Unit B: `api` (Render web service)
- Unit C: `worker` (Render background worker)
- Data: managed Postgres + Redis
- Storage: S3/R2

Rationale:
- API and worker scale independently.
- Dashboard stays optimized for edge/static + server actions.
- DB/Redis managed services reduce ops overhead for v1.

## 6) Observability & Reliability Baseline

- Structured JSON logs with request/job correlation IDs.
- Sentry for unhandled exceptions and performance traces.
- `job_executions` table as operational ledger.
- Dead-letter queue monitoring + daily failed-job digest.
- LLM token + cost persisted in `llm_usage_logs`.

## 7) Security Baseline

- Internal auth with SSO or email-domain restricted login.
- RBAC roles: `EDITOR`, `REVIEWER`, `ADMIN`.
- Secrets only in Vercel/Render secret stores, never in git.
- Dev.to and OpenAI keys server-side only.
- Audit trail in `workflow_events` for approval/publish actions.
