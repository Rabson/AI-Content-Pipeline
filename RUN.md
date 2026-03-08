# Run Guide

This file is the runtime runbook only.
It documents how to start, verify, and stop the system locally.

## Runtime Modes
- Docker for full local stack
- Host `npm` processes with Dockerized infra

## Prerequisites
- Node.js and npm installed
- Docker and Docker Compose installed
- root [`.env`](.env) configured

## Local Ports
- Postgres: `5432`
- Redis: `6380`
- MinIO API: `9000`
- MinIO Console: `9001`
- API: `3001`
- Worker health/metrics: `3002`
- Dashboard: `3003`

## Option 1: Full Docker Runtime

### Start
```bash
cd <repo-root>
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d
```

First local boot after a `package-lock.json` change is slower because each app container refreshes its own `node_modules` volume. API and worker also regenerate Prisma during that refresh.
Local Postgres data is stored in `.local-data/postgres` on the host, so local Docker boots do not depend on a Docker Desktop volume for database writes.

If Docker disk space is tight, the local override can fail during `npm ci` or Prisma generate inside app containers. In that case, use the base runtime below to verify built images without bind-mounted dev bootstrap.

### Verify
```bash
curl -fsS http://localhost:3001/api/health
curl -fsS http://localhost:3001/api/ready
curl -fsS http://localhost:3002/health
curl -fsS http://localhost:3002/ready
curl -I http://localhost:3003/signin
```

### Logs
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml logs -f api worker dashboard
```

### Stop
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml down
```

## Option 1B: Base Docker Runtime

This runs the built images directly and avoids the local dev bootstrap path.

### Start
```bash
cd <repo-root>
docker compose --env-file .env -f infra/docker/compose.base.yml up -d --build
```

### Verify
```bash
curl -fsS http://localhost:3001/api/health
curl -fsS http://localhost:3001/api/ready
curl -fsS http://localhost:3002/health
curl -fsS http://localhost:3002/ready
curl -I http://localhost:3003/signin
```

### Stop
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml down
```

## Option 2: Docker Infra + Host Services

### Start infra only
```bash
cd <repo-root>
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d postgres redis minio
```

### Run migrations
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up migrate
```

### Start host dev services
Run each in a separate terminal.

#### API
```bash
cd <repo-root>
npm run dev:api
```

#### Worker
```bash
cd <repo-root>
npm run dev:worker
```

#### Dashboard
```bash
cd <repo-root>
npm run dev:dashboard
```

### Start host production-style services
Build first, then run each in a separate terminal.

```bash
cd <repo-root>
npm run build:api
npm run build:worker
npm run build:dashboard
```

#### API
```bash
npm run start:api
```

#### Worker
```bash
npm run start:worker
```

#### Dashboard
```bash
npm run start:dashboard
```

## Useful Commands
```bash
make dev-up
make dev-up-base
make dev-down
make dev-ps
make dev-logs
make smoke-docker
make prisma-migrate-deploy
make clean
npm audit
npm run test
```

## Local Access
- Dashboard sign-in: `http://localhost:3003/signin`
- `ADMIN`: `admin@example.com` / `AdminPass123!`
- `EDITOR`: `editor@example.com` / `EditorPass123!`
- `REVIEWER`: `reviewer@example.com` / `ReviewerPass123!`
- `USER`: `normal_user@example.com` / `UserPass123!`
- After sign-in:
  - use `/account` to store `DEVTO`, `MEDIUM`, and `LINKEDIN` credentials
  - approved content is assigned to the `USER` owner
  - the `USER` owner can publish to ready channels
  - `ADMIN` can reassign ownership and publish on behalf of the owner

## Notes
- Root `npm start` is not defined; use `start:api`, `start:worker`, and `start:dashboard`.
- Root scripts build the shared workspace packages first, then inject the repo-level `.env` automatically:
  - `@aicp/shared-config`
  - `@aicp/auth-core`
  - `@aicp/observability-core`
  - `@aicp/workflow-core`
  - `@aicp/contracts`
  - `@aicp/queue-contracts`
  - `@aicp/backend-core`
- `npm install` and `npm ci` run `postinstall`, which builds shared packages and regenerates the Prisma client when full workspace sources are present (partial build contexts skip this safely).
- `@aicp/shared-config` now builds to `dist/`; runtime consumers import package exports instead of generated files beside source.
- Workspace tests use Vitest 4 and the shared ESM config file `vitest.config.mts`.
- API and worker must share the same `USER_TOKEN_ENCRYPTION_KEY`, because publisher tokens are encrypted in API and decrypted in worker during publish jobs.
- Dashboard theme preference is stored in browser local storage under `aicp-dashboard-theme`.
- Publisher channel API env also needs:
  - `MEDIUM_API_BASE_URL`
  - `LINKEDIN_API_BASE_URL`
  - `LINKEDIN_API_VERSION`
- For Docker-only command detail, see [docker-local-commands.md](./docs/docker-local-commands.md).
- Non-local API runtime still requires:
  - `INTERNAL_SERVICE_JWT_SECRET`
  - `INTERNAL_SERVICE_JWT_ISSUER`
  - `INTERNAL_SERVICE_JWT_AUDIENCE`
- Local mode can still use `AUTH_ALLOW_HEADER_BYPASS=true` for direct local tooling, but dashboard requests already use signed bearer tokens.
