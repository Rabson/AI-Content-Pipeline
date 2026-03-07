I want to build an AI-powered content pipeline system for technical blogging and distribution.

Your job is to act like a senior software architect and implementation planner.

I do NOT want vague ideas, generic suggestions, or high-level fluff. I want a practical, production-minded system design using the exact stack and constraints below.

## Product Goal

Build a system where:

1. I can manually add a topic
2. The system researches the topic
3. The system generates a structured outline
4. The system writes a draft blog post
5. I review the draft and add comments/feedback
6. The system revises only the selected sections
7. I approve the final version
8. The system publishes to Dev.to
9. The system generates a LinkedIn post draft for manual review
10. Later, the system can support analytics, topic discovery, and more platforms

This is an internal content operations system, not a public SaaS product.

## Recommended Stack (must use this)

### Backend

- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ

### Frontend / Dashboard

- Next.js
- TypeScript
- Tailwind CSS

### Infra / Deployment

- Docker + Docker Compose for local development
- Vercel for frontend/dashboard
- Render for backend API
- Render background worker for BullMQ jobs
- Managed PostgreSQL
- Managed Redis
- S3 or Cloudflare R2 for asset storage
- GitHub Actions for CI/CD
- Sentry for error tracking

### AI / External APIs

- OpenAI API for generation
- Dev.to API for publishing

## Architecture Constraints

- Start as a modular monolith, NOT microservices
- Keep strong module/service boundaries in code
- Use background jobs for long-running tasks
- Human approval must exist before publishing
- Revisions must be section-level, NOT full-document rewrites
- Every major artifact must be versioned
- The dashboard is required
- Focus on v1 first, but keep the design extensible
- Do not overengineer with Kubernetes, Temporal, event buses, or vector databases unless clearly justified

## What I want from you

Design this system in detail.

Structure your answer in the following order:

---

# 1. System Overview

Explain what the system does, who uses it, and the end-to-end workflow.

# 2. Recommended Architecture

Explain the modular monolith architecture and why it is the right choice for v1.
Describe how API, worker, DB, Redis, and dashboard work together.

# 3. Core Modules / Services

Break down each module with:

- responsibility
- inputs
- outputs
- key business logic
- database tables involved
- API endpoints
- BullMQ jobs involved
- failure cases / edge cases

The modules must include:

- Topic Service
- Research Service
- Outline Service
- Draft Service
- Review Service
- Revision Service
- SEO/Metadata Service
- Publisher Service
- Social Post Service
- Workflow Orchestrator
- Analytics Service (design for later phase)
- Admin Dashboard

# 4. End-to-End Workflow

Show the exact lifecycle from topic creation to publication.
Use statuses/states for each stage.

# 5. Database Design

Propose PostgreSQL tables for the system.
For each table include:

- purpose
- important columns
- relationships
  Do not stay abstract. Be concrete.

# 6. BullMQ Queue Design

List queues, job names, payload shapes, retry policy, and failure handling strategy.
Explain which work should be synchronous vs asynchronous.

# 7. API Design

Design the main REST endpoints for backend modules.
Group them by module.
Include example request/response shapes where useful.

# 8. Dashboard Design

Describe the internal dashboard pages and components needed:

- topics list
- research view
- outline preview
- draft editor
- review/comments UI
- revision diff UI
- publish screen
- publication history
- analytics page
  Explain the operator workflow through the UI.

# 9. Implementation Plan

Give a phased implementation plan:

- Phase 1: core content pipeline
- Phase 2: publishing and social distribution
- Phase 3: analytics and discovery
  For each phase, explain what should be built first and why.

# 10. Folder / Monorepo Structure

Propose a clean monorepo structure for this project using the recommended stack.
Include backend, frontend, shared packages, infra, and Docker setup.

# 11. Infra and Deployment Design

Explain exactly how this should run:

- local development
- staging
- production
  Describe deployment units and environment variables.
  Explain how Vercel, Render, Postgres, Redis, storage, and Sentry fit together.

# 12. CI/CD Design

Design GitHub Actions workflows for:

- lint
- typecheck
- tests
- Prisma migration checks
- frontend deploy
- backend deploy
- worker deploy

# 13. Observability and Reliability

Explain logging, tracing, error handling, failed jobs, retries, and monitoring.
Include cost tracking for LLM usage.

# 14. Security and Access Control

This is an internal admin system.
Design simple but sane authentication/authorization.
Explain secrets management and API key handling.

# 15. Future Extensions

Explain how the system can later support:

- topic discovery
- Medium integration
- automated analytics sync
- multi-platform publishing
- model fallback
- team collaboration

## Output Requirements

- Be concrete and implementation-focused
- Prefer clear structures over vague theory
- Give real examples of payloads, statuses, and entities
- Make reasonable assumptions instead of asking follow-up questions
- Do not recommend replacing the stack unless there is a strong technical reason
- Do not hand-wave operational details
- Call out tradeoffs honestly
- Optimize for a realistic v1 that can ship

At the end, provide:

1. a short summary of the best build order
2. the biggest technical risks
3. the most common mistakes to avoid
   Better way to use it
