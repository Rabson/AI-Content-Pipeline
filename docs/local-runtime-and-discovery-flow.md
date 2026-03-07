# Local Runtime and Discovery Flow

## What Was Verified
- Runtime reads [`.env`](../.env); [`.env.example`](../.env.example) is template-only.
- Root `npm run dev:*`, `start:*`, and `build:*` scripts build `@aicp/shared-config` first.
- Service-local env modules are:
  - API: [`env.ts`](../apps/api/src/config/env.ts)
  - Worker: [`env.ts`](../apps/worker/src/config/env.ts)
  - Dashboard: [`env.ts`](../apps/dashboard/src/config/env.ts)
- Docker local stack is currently running successfully with the default local ports:
  - Postgres on `5432`
  - Redis on `6380`
  - API on `3001`
  - Worker metrics on `3002`
  - Dashboard on `3003`
- `migrate` completed with exit code `0`.
- Verified inside the running containers:
  - API `GET /api/health` -> `200`
  - API `GET /api/ready` -> `200`
  - API `GET /api/v1/topics` -> `200`
  - API `GET /api/v1/discovery/candidates` -> `200`
  - API `GET /api/v1/ops/runtime-status` -> `200`
  - Worker `GET /health` -> `200`
  - Worker `GET /ready` -> `200`
  - Worker `GET /metrics` -> `200`
  - Dashboard `GET /signin` -> `200`
- Protected dashboard routes redirect to sign-in until authenticated.
- Dashboard shared layout now remains usable on narrow/mobile widths:
  - auth screen uses a single centered card
  - navbar and topic nav wrap or scroll instead of clipping
  - action rows stack on smaller screens
- Discovery flow now supports:
  - manual discovery intake -> auto scoring/filtering
  - API-backed discovery import (`hackernews`) -> auto scoring/filtering
  - discovery candidate review queue via API

## Ready
- `POST /api/v1/discovery/topics/manual`
- `POST /api/v1/discovery/topics/import`
- `GET /api/v1/discovery/candidates`
- `GET /api/v1/discovery/suggestions`
- Topic scoring/approval/rejection flow
- Research handoff flow after approval
- Admin-only Ops screen in dashboard
- Docker local stack with migration bootstrap and health endpoints

## Not Ready / Caveats
- Default Docker host ports can conflict with existing local services.
  - Common conflicts observed: `6379`, `3000`
  - Use env overrides such as `REDIS_HOST_PORT=6380` and `DASHBOARD_HOST_PORT=3003`
- API-backed discovery depends on outbound access to the configured provider.
  - Current provider: Hacker News Algolia API
  - Results can be auto-filtered out if they score below the threshold.
- Non-Docker startup still requires a running PostgreSQL and Redis instance.
- In restricted environments, host `curl localhost:...` can fail even while the containers are healthy.
  - Use the container-level verification commands in [docker-local-commands.md](./docker-local-commands.md) if that happens.

## With Docker

### 1. Optional port overrides
```bash
export REDIS_HOST_PORT=6380
export DASHBOARD_HOST_PORT=3003
```

### 2. Start the full stack
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml up -d
```

### 3. Health checks
```bash
curl -fsS http://localhost:3001/api/health
curl -fsS http://localhost:3001/api/ready
curl -fsS http://localhost:3002/health
curl -fsS http://localhost:3002/ready
curl -I -fsS http://localhost:3003/signin | head -n 1
```

### 4. Container-level fallback checks
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml exec -T api \
  node -e "fetch('http://localhost:3001/api/health').then(async r=>{console.log(r.status);console.log(await r.text())})"

docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml exec -T worker \
  node -e "fetch('http://localhost:3002/ready').then(async r=>{console.log(r.status);console.log(await r.text())})"

docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml exec -T dashboard \
  node -e "fetch('http://localhost:3003/signin').then(async r=>{console.log(r.status);console.log((await r.text()).slice(0,200))})"
```

### 5. Stop the stack
```bash
docker compose --env-file .env -f infra/docker/compose.base.yml -f infra/docker/compose.local.yml down
```

## Service Connection Map
- Dashboard -> API over HTTP
- API -> PostgreSQL for state
- API -> Redis for BullMQ enqueue
- Worker -> Redis for BullMQ consume
- Worker -> PostgreSQL for orchestration writes
- Discovery API provider -> external API fetch (`hackernews`)

## Flow: Topic Discovery -> Scoring / Filtering -> Research

### Manual discovery intake
```bash
curl -fsS -X POST http://localhost:3001/api/v1/discovery/topics/manual \
  -H 'content-type: application/json' \
  -d '{
    "title": "BullMQ backpressure patterns for AI pipelines",
    "brief": "Investigate queue throttling, retries, and backpressure design for AI content workers.",
    "audience": "platform engineers",
    "tags": ["bullmq", "queues", "ai-ops"],
    "autoScore": true,
    "minimumScore": 6
  }'
```

Effect:
- topic is created with source `DISCOVERY_MANUAL`
- status moves `DRAFT -> SUBMITTED -> SCORED`
- if score is below threshold, it auto-moves to `REJECTED`

### API-backed discovery import
```bash
curl -fsS -X POST http://localhost:3001/api/v1/discovery/topics/import \
  -H 'content-type: application/json' \
  -d '{
    "provider": "hackernews",
    "query": "bullmq queues",
    "limit": 1,
    "autoScore": true,
    "minimumScore": 6
  }'
```

Effect:
- queue job `discovery.import` is pushed to `content.pipeline`
- worker fetches provider results
- each imported topic goes through the same `SUBMITTED -> SCORED -> REJECTED|SCORED` flow

### Review queue
```bash
curl -fsS 'http://localhost:3001/api/v1/discovery/candidates?limit=10'
```

### Reviewer scoring / approval path
If a discovery candidate is already `SCORED`, the reviewer can approve it directly.

```bash
curl -fsS -X POST http://localhost:3001/api/v1/topics/<topicId>/approve \
  -H 'content-type: application/json' \
  -d '{"note":"Approved for research"}'
```

If a topic was created without auto-scoring, use manual scoring first:
```bash
curl -fsS -X POST http://localhost:3001/api/v1/topics/<topicId>/score \
  -H 'content-type: application/json' \
  -d '{
    "novelty": 7,
    "businessValue": 8,
    "effort": 4,
    "audienceFit": 8,
    "timeRelevance": 7
  }'
```

### Handoff to research
```bash
curl -fsS -X POST http://localhost:3001/api/v1/topics/<topicId>/handoff-research \
  -H 'content-type: application/json' \
  -d '{}'
```

Effect:
- API enqueues `research.run` on `content.pipeline`
- worker consumes it and moves the topic into the research workflow
