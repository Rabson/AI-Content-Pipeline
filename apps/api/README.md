# API Service

NestJS HTTP API for the AI content pipeline.

## Responsibilities
- topic, discovery, research, outline, draft, revision, publish, analytics, and ops APIs
- Prisma/PostgreSQL persistence
- BullMQ job enqueueing
- storage signing and publication adapters
- health, readiness, and runtime-status endpoints

## Runtime and Config
- Service-local env module: [env.ts](./src/config/env.ts)
- Service-local feature flags: [feature-flags.ts](./src/config/feature-flags.ts)
- Root `npm run dev:api`, `start:api`, and `build:api` build `@aicp/shared-config` first, then inject the repo-level [`.env`](../../.env)
- Docker image spec: [Dockerfile](./Dockerfile)
- Docker build ignore: [Dockerfile.dockerignore](./Dockerfile.dockerignore)
- Render manifests:
  - [render.yaml](./render.yaml)
  - [render.staging.yaml](./render.staging.yaml)

## Common Commands
```bash
npm run dev:api
npm run start:api
npm run build:api
```

## Health Endpoints
- `/api/health`
- `/api/ready`
- `/api/v1/ops/runtime-status`
