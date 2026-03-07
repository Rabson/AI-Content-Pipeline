# Dashboard Service

Next.js internal dashboard for operators, reviewers, and editors.

## Responsibilities
- topic, discovery, research, draft, revision, publish, analytics, and ops views
- dashboard auth and role-based navigation
- backend error presentation and route-level error boundaries
- mobile-friendly operator UI

## Runtime and Config
- Service-local env module: [env.ts](./src/config/env.ts)
- Root `npm run dev:dashboard`, `start:dashboard`, and `build:dashboard` build `@aicp/shared-config` first, then inject the repo-level [`.env`](../../.env)
- Docker image spec: [Dockerfile](./Dockerfile)
- Docker build ignore: [Dockerfile.dockerignore](./Dockerfile.dockerignore)
- Vercel config: [vercel.json](./vercel.json)
- Next config: [next.config.ts](./next.config.ts)

## Common Commands
```bash
npm run dev:dashboard
npm run start:dashboard
npm run build:dashboard
```

## Local URL
- Sign-in: `http://localhost:3003/signin`
- Protected routes redirect to sign-in until authenticated
