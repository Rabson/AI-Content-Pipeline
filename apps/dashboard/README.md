# Dashboard Service

Next.js internal dashboard for admins, editors, reviewers, and assigned users.

## Responsibilities
- topic, discovery, research, draft, revision, publish, analytics, and ops views
- dashboard auth and role-based navigation
- account page for per-user publisher credentials
- backend error presentation and route-level error boundaries
- mobile-friendly operator UI
- persisted light/dark theme with a shared chrome toggle
- publish readiness, banner image management, owner assignment, and publication retry views

## Runtime and Config
- Service-local env module: [env.ts](./src/config/env.ts)
- Root `npm run dev:dashboard`, `start:dashboard`, and `build:dashboard` build the shared workspace packages first, then inject the repo-level [`.env`](../../.env)
- Tests run through the shared Vitest 4 config at `../../vitest.config.mts`.
- Docker image spec: [Dockerfile](./Dockerfile)
- Docker build ignore: [Dockerfile.dockerignore](./Dockerfile.dockerignore)
- Vercel config: [vercel.json](./vercel.json)
- Next config: [next.config.ts](./next.config.ts)

## Auth Notes
- Dashboard sign-in uses API-backed email/password authentication.
- API issues a short-lived bearer token at login; dashboard stores it in the NextAuth session and forwards it on server-side API calls.
- Dashboard sign-in throttling uses Redis when `REDIS_URL` is available, with in-memory fallback only as a last resort.
- Local seeded users are created by `apps/api/scripts/seed-demo.mjs`.
- `USER` sees assigned approved content and chooses where to publish.
- `ADMIN` can reassign owners and publish on behalf of the assigned `USER`.
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
- Publishing workflow:
  - `/account` stores per-user `DEVTO`, `MEDIUM`, and `LINKEDIN` credentials
  - `/topics/[topicId]/publish` shows channel readiness, owner assignment, banner image controls, and publication history
- Theme:
  - the shared header toggle switches light/dark mode
  - the preference is persisted in `localStorage`
