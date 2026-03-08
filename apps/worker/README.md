# Worker Service

BullMQ background worker for the AI content pipeline.

## Responsibilities
- consumes content pipeline, social, publishing, and analytics queues
- runs OpenAI-backed generation workflows
- updates workflow/job telemetry
- exposes worker health and metrics endpoints

## Runtime and Config
- Service-local env module: [env.ts](./src/config/env.ts)
- Root `npm run dev:worker`, `start:worker`, and `build:worker` build `@aicp/shared-config` first, then inject the repo-level [`.env`](../../.env)
- Tests run through the shared Vitest 4 config at `../../vitest.config.mts`.
- Worker must use the same `USER_TOKEN_ENCRYPTION_KEY` as API so publish jobs can decrypt stored publisher credentials.
- Docker image spec: [Dockerfile](./Dockerfile)
- Docker build ignore: [Dockerfile.dockerignore](./Dockerfile.dockerignore)
- Render manifests:
  - [render.yaml](./render.yaml)
  - [render.staging.yaml](./render.staging.yaml)

## Common Commands
```bash
npm run dev:worker
npm run start:worker
npm run build:worker
```

## Health Endpoints
- `/health`
- `/ready`
- `/metrics`
