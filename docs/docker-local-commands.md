# Docker Local Commands

## Prerequisites
Run from the repo root:

```bash
cd <repo-root>
```

Make sure Docker is available:

```bash
docker --version
docker compose version
```

This repo uses root [`.env`](../.env) as the runtime config source.

## Compose Files
- Base stack: [`compose.base.yml`](../infra/docker/compose.base.yml)
- Local override: [`compose.local.yml`](../infra/docker/compose.local.yml)
- Staging-like override: [`docker-compose.staginglike.yml`](../infra/docker/docker-compose.staginglike.yml)

Service image specs live beside each app:
- [apps/api/Dockerfile](../apps/api/Dockerfile)
- [apps/worker/Dockerfile](../apps/worker/Dockerfile)
- [apps/dashboard/Dockerfile](../apps/dashboard/Dockerfile)

Docker build-context filtering is service-local too:
- [apps/api/Dockerfile.dockerignore](../apps/api/Dockerfile.dockerignore)
- [apps/worker/Dockerfile.dockerignore](../apps/worker/Dockerfile.dockerignore)
- [apps/dashboard/Dockerfile.dockerignore](../apps/dashboard/Dockerfile.dockerignore)

## Start Full Stack
Starts:
- `postgres`
- `redis`
- `minio`
- `migrate`
- `api`
- `worker`
- `dashboard`

```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d
```

Note:
- In local dev mode, `api`, `worker`, and `dashboard` each maintain their own `node_modules` volume.
- On the first startup after a `package-lock.json` change, each service runs `npm ci`.
- `api` and `worker` also run `prisma generate` during that refresh.
- Local Postgres persists to `.local-data/postgres` on the host.
- That first boot is slower by design; later restarts reuse the lock-hash marker and start normally.
- If Docker reports `ENOSPC`, use the base stack below to validate built images without the dev bootstrap path.

## Start Base Runtime
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml up -d --build
```

This mode avoids bind-mounted dev bootstrap and is the better verification path when Docker disk space is tight.

## Start Services Step by Step

### 1. Infrastructure
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d postgres redis minio
```

### 2. Run migrations
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up migrate
```

### 3. Start API
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d api
```

### 4. Start worker
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d worker
```

### 5. Start dashboard
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d dashboard
```

## Health Checks

### API
```bash
curl -fsS http://localhost:3001/api/health
curl -fsS http://localhost:3001/api/ready
```

### Worker
```bash
curl -fsS http://localhost:3002/health
curl -fsS http://localhost:3002/ready
curl -fsS http://localhost:3002/metrics
```

### Dashboard
```bash
curl -I http://localhost:3003/signin
```

### Container-level fallback
Use these if host `curl localhost:...` is blocked by your environment even though Docker is running.

```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml exec -T api \
  node -e "fetch('http://localhost:3001/api/health').then(async r=>{console.log(r.status);console.log(await r.text())})"

docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml exec -T worker \
  node -e "fetch('http://localhost:3002/ready').then(async r=>{console.log(r.status);console.log(await r.text())})"

docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml exec -T dashboard \
  node -e "fetch('http://localhost:3003/signin').then(async r=>{console.log(r.status);console.log((await r.text()).slice(0,200))})"
```

## Service Status and Logs

### Show container status
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml ps
```

### Tail all main app logs
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml logs -f api worker dashboard
```

### Tail one service
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml logs -f api
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml logs -f worker
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml logs -f dashboard
```

## Restart Services

### Restart one service
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml restart api
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml restart worker
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml restart dashboard
```

### Recreate app services
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d --force-recreate api worker dashboard
```

## Stop Stack

### Stop services and keep volumes
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml down
```

### Stop services and remove volumes
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml down -v
```

## Current Local Ports
From the current [`.env`](../.env):

- API: `3001`
- Worker health/metrics: `3002`
- Dashboard: `3003`
- Postgres: `5432`
- Redis: `6380`
- MinIO API: `9000`
- MinIO Console: `9001`

## Dashboard Access
- Sign-in URL: `http://localhost:3003/signin`
- Seeded local identities:
  - `admin@example.com` / `AdminPass123!` (`ADMIN`)
  - `editor@example.com` / `EditorPass123!` (`EDITOR`)
  - `reviewer@example.com` / `ReviewerPass123!` (`REVIEWER`)
  - `normal_user@example.com` / `UserPass123!` (`USER`)
- `Ops` is visible only to `ADMIN`
- Protected routes redirect to sign-in until authenticated
- `/account` manages `DEVTO`, `MEDIUM`, and `LINKEDIN` credentials
- `/topics/[topicId]/publish` manages publish readiness, banner image, owner assignment, and retry

## Service Connection Map
- `dashboard` -> `api`
- `api` -> `postgres`
- `api` -> `redis`
- `worker` -> `redis`
- `worker` -> `postgres`
- `api` and `worker` -> `minio`

## Quick Smoke Test Flow

### Create a manual discovery topic
```bash
curl -fsS -X POST http://localhost:3001/api/v1/discovery/topics/manual \
  -H 'content-type: application/json' \
  -d '{
    "title":"BullMQ backpressure patterns for AI pipelines",
    "brief":"Investigate queue throttling, retries, and backpressure design for AI content workers.",
    "audience":"platform engineers",
    "tags":["bullmq","queues","ai-ops"],
    "autoScore":true,
    "minimumScore":6
  }'
```

### List discovery candidates
```bash
curl -fsS 'http://localhost:3001/api/v1/discovery/candidates?limit=10'
```

### Check admin ops payload
```bash
curl -fsS http://localhost:3001/api/v1/ops/runtime-status \
  -H 'x-user-email: admin@example.com' \
  -H 'x-actor-role: ADMIN' \
  -H 'x-actor-id: admin@example.com'
```

## Make Shortcuts
These wrap the same Docker commands:

```bash
make dev-up
make dev-ps
make dev-logs
make dev-down
make health-api
make health-worker
make clean
```

## Cleanup Note
- `make clean` removes local generated artifacts such as Next build output.
- If the dashboard service is already running, recreate it after a clean:

```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d --force-recreate dashboard
```
