# System Summary

This file is the product and architecture brief only.
It explains what the system is for, what problems it solves, and the design constraints that shape the implementation.

## Product Goal
Build an internal AI-assisted content operations system for technical blogging.

The system should support:
1. manual topic intake
2. topic discovery intake
3. topic scoring and approval
4. structured research generation
5. outline generation
6. section-by-section draft generation
7. section-level review comments
8. section-level revisions only
9. final approval
10. publishing and distribution workflows

## Intended Users
- `EDITOR`: creates topics, reviews drafts, manages content flow
- `REVIEWER`: approves or rejects topics and draft revisions
- `ADMIN`: operates the system, views ops metrics, handles failed jobs and replay flows

## System Shape
- modular monolith
- NestJS API for commands and reads
- BullMQ worker for long-running generation and publish jobs
- Next.js dashboard for operators
- PostgreSQL as source of truth
- Redis for queue transport
- S3/R2-compatible storage for assets

## Core Workflow
1. Topic is created manually or imported through discovery.
2. Topic is scored and filtered.
3. Approved topic is handed off to research.
4. Research output becomes an outline.
5. Outline becomes a draft, generated section by section.
6. Human reviewer leaves comments mapped to sections.
7. Revision regenerates only the targeted sections.
8. Final draft is approved.
9. Publisher service pushes approved content to external platforms.
10. Social and analytics flows extend the same lifecycle.

## Non-Negotiable Design Rules
- human approval exists before publishing
- revisions are section-level, not full-document rewrites
- every major artifact is versioned
- long-running work runs in background jobs
- dashboard is required
- v1 stays a modular monolith, not microservices

## Major Modules
- Topic
- Discovery
- Workflow
- Research
- Outline
- Draft
- Review
- Revision
- SEO
- Social
- Publisher
- Analytics
- Ops
- Storage

## Current Implementation Direction
- API owns workflow state transitions, auth, persistence, and queue enqueueing.
- Worker owns job execution, retries, metrics, and telemetry.
- Dashboard owns operator UX and API-backed workflows.
- Shared contracts live in `packages/contracts`.
- Shared TS env/tooling helpers live in `packages/shared-config`.

## Document Ownership
- [README.md](./README.md): repo overview and navigation
- [RUN.md](./RUN.md): runtime commands only
- [docs/README.md](./docs/README.md): detailed architecture and implementation docs
- service READMEs under `apps/*`: service-specific runtime and deployment notes
