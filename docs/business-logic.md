# Business Logic Source of Truth

This document is the canonical business-logic specification for the AI content pipeline.

If workflow behavior, gating rules, artifact semantics, or ownership changes, update this file first.

## Scope

This file defines:
- domain actors and permissions at workflow level
- end-to-end business flow from topic intake to publishing
- artifact and versioning rules
- approval and revision constraints
- LLM vs human ownership boundaries
- currently known unconnected business-logic gaps

This file does not define:
- deployment commands (see `RUN.md`)
- low-level infra or CI details (see `docs/stage-3-*`)
- full schema reference by column (see `docs/stage-2-*`)

## Actors and Business Capabilities

- `EDITOR`
  - create/manage topics
  - run or trigger content generation steps
  - prepare content through draft/revision lifecycle
- `REVIEWER`
  - approve/reject topics
  - approve/reject review cycles and revision outcomes
- `USER` (content owner)
  - owns approved content for publishing decisions
  - manages own publishing credentials and channel choices
- `ADMIN`
  - full operator capabilities
  - can reassign owners
  - can publish on behalf of owner
  - handles failure replay/ops controls

## Core Business Flow

1. Topic intake
   - source: manual create or discovery import
   - output: topic in scoring pipeline
2. Topic scoring and filtering
   - topic gets a score and confidence signal
   - reviewer/admin approves or rejects
3. Research
   - only approved topic can enter research
   - output must be structured research JSON (not prose)
4. Outline generation
   - based on latest research artifact
5. Draft generation
   - generated section-by-section
   - output is versioned draft artifact
6. Human review
   - comments must map to sections
7. Revision
   - section-level only
   - non-targeted sections must not be rewritten
8. Final approval
   - required before publish
9. Owner assignment and publish prep
   - approved content assigned to a `USER`
   - owner/admin selects channels and credentials
10. Publish + social distribution
   - publish to configured channels
   - generate social outputs downstream

## Workflow State Model

Reference lifecycle:
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

Allowed loop:
- `REVIEW_IN_PROGRESS -> REVISION_IN_PROGRESS -> REVISION_READY -> REVIEW_IN_PROGRESS`

Hard gates:
- publish requires approved latest content version
- any invalid transition must be rejected and logged

## Artifact and Versioning Rules

- Every major artifact is immutable and versioned.
- Required artifact families:
  - research
  - outline
  - draft
  - revision outputs/diffs
  - SEO metadata
  - social outputs
  - publication attempts/results
- Draft version rules:
  - revisions create new versions
  - previous versions are preserved
  - section identity remains stable across versions

## Human vs LLM Ownership

LLM-owned outputs:
- research notes and structure
- outline proposals
- draft section content
- revision candidates for targeted sections
- SEO/social suggestions

Human-owned decisions:
- topic approval/rejection
- review comments and final acceptance
- final publish authorization
- channel selection and ownership decisions

## Sync vs Async Business Boundaries

Synchronous API actions:
- topic CRUD and scoring commands
- approval/rejection commands
- review comment writes
- owner assignment and publish trigger requests

Asynchronous worker actions:
- research generation
- outline generation
- draft generation
- revision apply
- publish execution
- social generation
- analytics rollups

## Known Business-Logic Gaps (Not Fully Connected Yet)

These are the current P0 blockers before 10/10 modular-monolith + microservice readiness:

1. Worker still depends on API Prisma schema path in deployment/build scripts.
2. Service-level database ownership boundaries are defined in docs but not fully enforced in runtime guardrails.
3. Worker release path is improved but not fully independent in all deployment/runtime assumptions.
4. Contract compatibility policy is implemented but still needs strict matrix-based CI enforcement for every breaking path.
5. No production-grade pilot service extraction completed yet (planned: Research).
6. Per-service release/rollback gates are not fully independent across all promotion paths.

## Operational Business Invariants

- No publish without approval.
- No full-document rewrite during revision.
- No deletion of historical artifact versions.
- Replay actions must be idempotent.
- Failure states must be visible in ops UI with correlation IDs.

## Related Docs

- High-level brief: `summary.md`
- Root overview: `README.md`
- Runtime commands: `RUN.md`
- System/module deep dive: `docs/stage-1-system-overview-architecture-core-modules.md`
- Schema/queues/endpoints detail: `docs/stage-2-db-bullmq-api.md`
- Service ownership roadmap: `docs/service-data-ownership-roadmap.md`
- Reliability policy: `docs/reliability-idempotency-dlq-replay.md`
