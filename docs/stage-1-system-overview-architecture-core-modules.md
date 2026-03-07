# Stage 1: System Overview, Architecture, Core Modules

## 1) System Overview

### Goal
Build an internal AI-assisted content pipeline that turns manually submitted technical topics into:
- reviewed/approved long-form blog posts
- published posts on Dev.to
- LinkedIn draft posts for manual approval

### Primary User
- Content operator/editor (internal team)

### End-to-End v1 Workflow
1. Operator creates topic.
2. System runs research job and stores sources/notes.
3. System generates structured outline (sections, intent, key points).
4. System writes first draft with section-level artifacts.
5. Operator reviews draft and adds comments on specific sections.
6. System revises only selected sections (not full rewrite).
7. Operator approves final draft.
8. System publishes to Dev.to.
9. System generates LinkedIn draft for manual review/publish.

### Lifecycle States (content item)
- `TOPIC_CREATED`
- `RESEARCH_IN_PROGRESS`
- `RESEARCH_READY`
- `OUTLINE_IN_PROGRESS`
- `OUTLINE_READY`
- `DRAFT_IN_PROGRESS`
- `DRAFT_READY`
- `REVIEW_IN_PROGRESS`
- `REVISION_IN_PROGRESS`
- `REVISION_READY`
- `APPROVED`
- `PUBLISH_QUEUED`
- `PUBLISHED`
- `SOCIAL_DRAFT_READY`
- `FAILED`

## 2) Recommended Architecture (Modular Monolith)

### Why modular monolith for v1
- Fastest route to shipping with one codebase and one deployable API+worker boundary.
- Strong internal module interfaces still prevent future lock-in.
- Easier transactions and consistency for artifact versioning.
- Less operational complexity than microservices/Kubernetes/event bus.

### Runtime Components
- **Next.js dashboard (Vercel)**: operator UI.
- **NestJS API (Render web service)**: synchronous operations, orchestration triggers.
- **NestJS worker (Render worker service)**: BullMQ consumers for long-running/LLM tasks.
- **PostgreSQL**: source of truth for workflows, artifacts, versions, approvals.
- **Redis**: queue broker + transient coordination.
- **S3/R2**: optional large assets (images/export files).
- **Sentry**: error tracking for API/dashboard/worker.

### Interaction model
- UI calls API for CRUD, review actions, approvals.
- API writes workflow state + enqueues jobs.
- Worker executes jobs, writes outputs/artifacts, transitions states.
- Publisher jobs require `APPROVED` gate enforced in API and worker.

## 3) Core Modules

## Topic Service
- Responsibility: create/manage topics and initial metadata.
- Inputs: title, brief, audience, constraints, tags.
- Outputs: `topic` record + workflow start.
- Business logic: deduplicate similar active topics; enforce required fields.
- Tables: `topics`, `content_items`, `workflow_runs`.
- API: `POST /topics`, `GET /topics`, `GET /topics/:id`.
- Jobs: enqueue `research.run`.
- Failure cases: duplicate topic, invalid scope, missing target audience.

## Research Service
- Responsibility: gather/normalize research notes and references.
- Inputs: topic id + research directives.
- Outputs: structured research artifact version.
- Business logic: source filtering, citation normalization, token/cost tracking.
- Tables: `research_artifacts`, `source_references`, `artifact_versions`.
- API: `POST /topics/:id/research/run`, `GET /topics/:id/research`.
- Jobs: `research.run`.
- Failure cases: API timeout, empty sources, low-confidence output.

## Outline Service
- Responsibility: convert research into hierarchical outline.
- Inputs: approved/latest research artifact.
- Outputs: section tree with objectives.
- Business logic: enforce section count limits and narrative flow.
- Tables: `outlines`, `outline_sections`, `artifact_versions`.
- API: `POST /topics/:id/outline/generate`, `GET /topics/:id/outline`.
- Jobs: `outline.generate`.
- Failure cases: malformed section structure, missing research dependency.

## Draft Service
- Responsibility: generate section-level draft content.
- Inputs: outline sections + tone/style constraints.
- Outputs: draft with per-section bodies.
- Business logic: one section unit = one revisable unit; produce deterministic section ids.
- Tables: `drafts`, `draft_sections`, `artifact_versions`.
- API: `POST /topics/:id/draft/generate`, `GET /topics/:id/draft`.
- Jobs: `draft.generate`.
- Failure cases: partial section failures, length overrun, policy-filtered output.

## Review Service
- Responsibility: capture human comments/decisions.
- Inputs: reviewer comments bound to section ids.
- Outputs: review items and pending revision scope.
- Business logic: comment severity (`NIT`,`MAJOR`,`BLOCKER`), status transitions.
- Tables: `reviews`, `review_comments`, `approvals`.
- API: `POST /drafts/:id/reviews`, `POST /reviews/:id/comments`, `POST /reviews/:id/submit`.
- Jobs: none required for comment creation.
- Failure cases: comments referencing deleted/nonexistent section versions.

## Revision Service
- Responsibility: revise selected sections only.
- Inputs: targeted section ids + comments.
- Outputs: new draft version with changed sections and diff metadata.
- Business logic: immutable prior versions; only selected sections editable.
- Tables: `revisions`, `revision_items`, `draft_sections`, `artifact_versions`.
- API: `POST /reviews/:id/revisions/run`, `GET /drafts/:id/diff`.
- Jobs: `revision.apply`.
- Failure cases: selection drift between versions, comment conflicts.

## SEO/Metadata Service
- Responsibility: title variants, slug, summary, tags, canonical metadata.
- Inputs: approved draft.
- Outputs: seo metadata artifact.
- Business logic: enforce title length, slug uniqueness, excerpt length.
- Tables: `seo_metadata`, `artifact_versions`.
- API: `POST /topics/:id/seo/generate`, `GET /topics/:id/seo`.
- Jobs: `seo.generate`.
- Failure cases: slug collision, invalid metadata lengths.

## Publisher Service
- Responsibility: publish approved draft to Dev.to.
- Inputs: approved draft + seo metadata + platform config.
- Outputs: publication record with external post id/url.
- Business logic: approval hard-gate, idempotent publish via dedupe key.
- Tables: `publications`, `publication_attempts`.
- API: `POST /topics/:id/publish/devto`, `GET /topics/:id/publications`.
- Jobs: `publish.devto`.
- Failure cases: API auth error, rate limit, duplicate publish attempt.

## Social Post Service
- Responsibility: generate LinkedIn draft from approved/published content.
- Inputs: final blog + audience/tone.
- Outputs: social draft(s) with hashtags and CTA.
- Business logic: multiple variants and manual approval state.
- Tables: `social_posts`, `social_post_versions`.
- API: `POST /topics/:id/social/linkedin/generate`, `PATCH /social-posts/:id/status`.
- Jobs: `social.linkedin.generate`.
- Failure cases: output too long, generic/noisy hashtags.

## Workflow Orchestrator
- Responsibility: govern state transitions and job chaining.
- Inputs: commands/events (`topic.created`, `review.submitted`, `approved`).
- Outputs: queued jobs + persisted workflow transitions.
- Business logic: guard invalid transitions; retry-safe orchestration.
- Tables: `workflow_runs`, `workflow_events`, `job_executions`.
- API: mostly internal module orchestration endpoints.
- Jobs: `workflow.advance` (optional), otherwise direct queue chaining.
- Failure cases: out-of-order completion, duplicate events.

## Analytics Service (later phase)
- Responsibility: track throughput, lead time, revision rates, publish cadence, LLM cost.
- Inputs: workflow events + token usage + publication metrics.
- Outputs: dashboard aggregates.
- Tables: `analytics_daily`, `llm_usage_logs`.
- API: `GET /analytics/overview`, `GET /analytics/topics/:id`.
- Jobs: `analytics.rollup.daily`.
- Failure cases: backfill lag, mismatched event timestamps.

## Admin Dashboard
- Responsibility: human control plane for all workflow steps.
- Inputs: operator actions.
- Outputs: API calls, approvals, publish commands.
- Pages: topics list, research, outline, draft editor, review comments, revision diff, publish, history, analytics.
- Failure cases: stale UI versions, concurrent edits.

## 4) End-to-End Workflow State Machine

### Transition rules
- `TOPIC_CREATED -> RESEARCH_IN_PROGRESS -> RESEARCH_READY`
- `RESEARCH_READY -> OUTLINE_IN_PROGRESS -> OUTLINE_READY`
- `OUTLINE_READY -> DRAFT_IN_PROGRESS -> DRAFT_READY`
- `DRAFT_READY -> REVIEW_IN_PROGRESS`
- `REVIEW_IN_PROGRESS -> REVISION_IN_PROGRESS -> REVISION_READY -> REVIEW_IN_PROGRESS` (loop until approval)
- `REVIEW_IN_PROGRESS -> APPROVED`
- `APPROVED -> PUBLISH_QUEUED -> PUBLISHED`
- `PUBLISHED -> SOCIAL_DRAFT_READY`
- Any step -> `FAILED` with retry path

### Guardrails
- Publishing requires `APPROVED` and latest version lock.
- Revisions operate on explicit section ids only.
- Every generated artifact creates immutable version row.
