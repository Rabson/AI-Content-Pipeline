# AI Content Pipeline

Internal AI-powered content operations system for technical topic intake, research, drafting, revision, and distribution.

![Full Flow Architecture](docs/architecture-full-flow.svg)

## What This Repo Is
This repo contains the full modular-monolith implementation for the content pipeline:
- `apps/api`: NestJS HTTP API
- `apps/worker`: BullMQ worker runtime
- `apps/dashboard`: Next.js internal dashboard
- `packages/backend-core`: shared backend runtime infrastructure (Prisma, logging, security-event primitives)
- `packages/contracts`: built API/dashboard view contracts and blog document types
- `packages/queue-contracts`: shared BullMQ queue names and job payload contracts
- `packages/auth-core`: shared JWT/service-token primitives
- `packages/observability-core`: shared OpenTelemetry runtime/config helpers
- `packages/workflow-core`: shared workflow transition maps/helpers
- `packages/shared-config`: shared TS env readers, ESLint presets, and TS base config

This file is the entry point. It stays high-level.

## Core Workflow
1. Create or discover a topic
2. Score and approve it
3. Run research
4. Generate an outline
5. Generate draft sections
6. Review and comment at section level
7. Revise selected sections only
8. Approve final content
9. Assign approved content to a `USER` owner
10. Configure per-user publisher credentials
11. Add or select a banner image
12. Publish to Dev.to, Medium, or LinkedIn when the selected channel is ready
13. Generate social distribution drafts

## Stack
- Frontend: Next.js
- API: NestJS + Prisma + PostgreSQL
- Worker: NestJS + BullMQ + Redis
- Storage: S3/R2-compatible object storage
- Deploy: Vercel + Render
- Monitoring: Sentry + OpenTelemetry hooks

## Quick Start
Local Docker runtime:
```bash
make dev-up
```

Host processes with Docker infra:
```bash
npm run dev:api
npm run dev:worker
npm run dev:dashboard
```

Dashboard sign-in:
- `http://localhost:3003/signin`
- After sign-in, use `/account` to manage publisher credentials for `DEVTO`, `MEDIUM`, and `LINKEDIN`.
- Approved topics flow to the assigned `USER` owner. That user can decide where to publish, and `ADMIN` can publish on the owner's behalf.

## Service Entry Points
- API health: `http://localhost:3001/api/health`
- API ready: `http://localhost:3001/api/ready`
- Worker health: `http://localhost:3002/health`
- Worker ready: `http://localhost:3002/ready`
- Dashboard: `http://localhost:3003/signin`

## Implementation Stage
- API: implemented and running
- Worker: implemented and running, but still coupled to API internals
- Dashboard: implemented and running
- Backend Core: first shared backend package is implemented and in use
- Contracts: implemented and used for view/document contracts
- Queue Contracts: implemented and used across API and worker
- Auth Core: implemented and used for service-token signing/verifying
- Observability Core: implemented and used by API/worker telemetry runtime
- Workflow Core: implemented and used by workflow transition logic
- Shared Config: implemented and used with `dist/` package output
- Docker infra: implemented and running locally
- Terraform infra: partially implemented, currently focused on storage/IAM

## Local Auth Seed
- `ADMIN`: `admin@example.com` / `AdminPass123!`
- `EDITOR`: `editor@example.com` / `EditorPass123!`
- `REVIEWER`: `reviewer@example.com` / `ReviewerPass123!`
- `USER`: `normal_user@example.com` / `UserPass123!`

## Important Files
- Runtime runbook: [RUN.md](./RUN.md)
- System summary: [summary.md](./summary.md)
- Docs index: [docs/README.md](./docs/README.md)
- Codebase handover: [docs/codebase-handover.md](./docs/codebase-handover.md)
- Security model: [docs/security-model.md](./docs/security-model.md)
- Env reference: [docs/env-reference.md](./docs/env-reference.md)
- API service notes: [apps/api/README.md](./apps/api/README.md)
- Worker service notes: [apps/worker/README.md](./apps/worker/README.md)
- Dashboard service notes: [apps/dashboard/README.md](./apps/dashboard/README.md)

## Repo Conventions
- Root `.env` is the local runtime source.
- Root `npm run dev:*`, `start:*`, `build:*`, `typecheck`, and `test` build the shared workspace packages first:
  - `@aicp/shared-config`
  - `@aicp/auth-core`
  - `@aicp/observability-core`
  - `@aicp/workflow-core`
  - `@aicp/contracts`
  - `@aicp/queue-contracts`
  - `@aicp/backend-core`
- Root install runs `postinstall`, which:
  - builds the shared workspace packages
  - regenerates the Prisma client via `apps/api/src/prisma/schema.prisma`
- Root and workspace tests run on Vitest 4 with shared config in `vitest.config.mts`.
- `@aicp/shared-config` now builds runtime output into `dist/` and exports package entry points from there.
- `apps/api/scripts/seed-demo.mjs` seeds the local user accounts and demo publish-ready topic.
- Service-local env access is centralized in:
  - `apps/api/src/config/env.ts`
  - `apps/worker/src/config/env.ts`
  - `apps/dashboard/src/config/env.ts`
- App-local aliases are defined in service TS configs:
  - API: `@api/*`
  - worker: `@worker/*`
  - dashboard: `@dashboard/*`
- API and worker share `USER_TOKEN_ENCRYPTION_KEY` so publisher credentials can be encrypted in API and decrypted in worker jobs.
- API signs short-lived internal bearer tokens on login, dashboard forwards them, and API verifies issuer/audience/expiry before trusting identity.
- Publisher channel support is:
  - `DEVTO`: implemented
  - `MEDIUM`: implemented
  - `LINKEDIN`: implemented
- Publish UI includes:
  - owner reassignment for `ADMIN`
  - channel readiness and credential checks
  - banner image upload/select/remove
  - publication history and retry
- Dashboard UI includes:
  - light/dark theme toggle in shared chrome
  - persisted theme preference in local storage
  - a single `.next` route-type/output strategy for both local and Docker runtime
- Docker image specs live beside each service.
- Compose files live under `infra/docker`.

## Validation Status
- `npm run prisma:generate` passes with Prisma `7.4.2` using `prisma.config.ts` + schema path (`apps/api/src/prisma/schema.prisma`).
- `npm run lint`, `npm run typecheck`, and `npm run test` pass on the current branch.
- `npm run build:api`, `npm run build:worker`, and `npm run build:dashboard` pass on the current branch.
- `npm audit` currently reports Prisma transitive advisories (`9` total: `5` moderate, `4` high) from `@prisma/dev` in Prisma `7.4.2`.
- `make smoke-docker` verifies API, worker, and dashboard health against the local Compose stack.

## Where To Find Details
- Detailed commands: [RUN.md](./RUN.md)
- Architecture and implementation docs: [docs/README.md](./docs/README.md)
- Product/system intent: [summary.md](./summary.md)
