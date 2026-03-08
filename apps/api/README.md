# API Service

NestJS HTTP API for the AI content pipeline.

## Responsibilities
- topic, discovery, research, outline, draft, revision, publish, analytics, and ops APIs
- user accounts, email/password login, Casbin RBAC, and publisher credential vault
- Prisma/PostgreSQL persistence
- BullMQ job enqueueing
- storage signing, banner asset lookup, and publication adapters
- health, readiness, and runtime-status endpoints

## Runtime and Config
- Service-local env module: [env.ts](./src/config/env.ts)
- Service-local feature flags: [feature-flags.ts](./src/config/feature-flags.ts)
- Root `npm run dev:api`, `start:api`, and `build:api` build `@aicp/shared-config` first, then inject the repo-level [`.env`](../../.env)
- Tests run through the shared Vitest 4 config at `../../vitest.config.mts`.
- Docker image spec: [Dockerfile](./Dockerfile)
- Docker build ignore: [Dockerfile.dockerignore](./Dockerfile.dockerignore)
- Render manifests:
  - [render.yaml](./render.yaml)
  - [render.staging.yaml](./render.staging.yaml)

## Security Notes
- Non-local API access requires `INTERNAL_API_TOKEN` plus forwarded actor headers.
- Unknown roles are rejected.
- Publisher credentials are encrypted with `USER_TOKEN_ENCRYPTION_KEY`.
- Upload signing enforces mime and size limits.
- Outbound discovery and publish clients use shared timeout handling.
- Approved content is assigned to a `USER` owner.
- The owner can publish to ready channels, and `ADMIN` can publish on the owner's behalf.
- Reference: [security-model.md](../../docs/security-model.md)

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

## Auth and User Endpoints
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `GET /api/v1/users/me/publisher-credentials`
- `PUT /api/v1/users/me/publisher-credentials/:channel`

## Publish and Ownership Endpoints
- `PATCH /api/v1/topics/:id/owner`
- `PATCH /api/v1/topics/:id/banner-image`
- `GET /api/v1/topics/:id/assets`
- `GET /api/v1/topics/:id/publications`
- `GET /api/v1/topics/:id/publications/options`
- `POST /api/v1/topics/:id/publications`
- `POST /api/v1/topics/:id/publications/:publicationId/retry`
