# Dashboard Service

Next.js internal dashboard for admins, editors, reviewers, and assigned users.

## Responsibilities
- topic, discovery, research, draft, revision, publish, analytics, and ops views
- dashboard auth and role-based navigation
- account page for per-user publisher credentials
- backend error presentation and route-level error boundaries
- mobile-friendly operator UI

## Runtime and Config
- Service-local env module: [env.ts](./src/config/env.ts)
- Root `npm run dev:dashboard`, `start:dashboard`, and `build:dashboard` build `@aicp/shared-config` first, then inject the repo-level [`.env`](../../.env)
- Tests run through the shared Vitest 4 config at `../../vitest.config.mts`.
- Docker image spec: [Dockerfile](./Dockerfile)
- Docker build ignore: [Dockerfile.dockerignore](./Dockerfile.dockerignore)
- Vercel config: [vercel.json](./vercel.json)
- Next config: [next.config.ts](./next.config.ts)

## Auth Notes
- Dashboard sign-in uses API-backed email/password authentication.
- Dashboard forwards trusted caller headers to the API and includes `INTERNAL_API_TOKEN` when configured.
- Local seeded users are created by `apps/api/scripts/seed-demo.mjs`.
- Reference: [security-model.md](../../docs/security-model.md)

## Common Commands
```bash
npm run dev:dashboard
npm run start:dashboard
npm run build:dashboard
```

## Local URL
- Sign-in: `http://localhost:3003/signin`
- Protected routes redirect to sign-in until authenticated
- Seeded users:
  - `admin@example.com` / `AdminPass123!`
  - `editor@example.com` / `EditorPass123!`
  - `reviewer@example.com` / `ReviewerPass123!`
  - `normal_user@example.com` / `UserPass123!`
