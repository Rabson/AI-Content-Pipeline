# ADR 0001: Contract-First + Database-First Workflow

Status: accepted  
Date: 2026-03-09

## Context

This project is a workflow-heavy system with strict state transitions, queue payloads, and durable artifacts:
- topic lifecycle states
- BullMQ payload contracts across API and worker
- Prisma-backed persistence for versioned content and approvals

Past implementation drift risk:
- API/worker logic changed before payload contracts
- workflow/status logic changed before DB constraints
- transport behavior diverged from persisted model semantics

## Decision

We adopt a hard implementation order for all workflow-affecting changes:

1. `@aicp/contracts` and `@aicp/queue-contracts`
2. Prisma schema + migration plan
3. `@aicp/workflow-core` transitions
4. API service/controller implementation
5. worker processors and orchestration
6. dashboard UI/actions

This order is mandatory when a change affects one or more of:
- HTTP contract shape
- queue payload schema or queue/job identity
- workflow status/state transitions
- persisted data model or constraints

## Implementation Rules

1. Contract-first:
   - update shared contracts before changing API handlers or worker processors
   - keep API and worker code consuming shared contracts, not ad-hoc payload shapes
2. Database-first:
   - update Prisma schema and migration intent before service logic assumes new fields/states
   - enforce invariants with DB constraints when possible (unique keys, FKs, enum constraints)
3. Workflow-core-first for transitions:
   - state changes must be represented in `@aicp/workflow-core` transition maps/tests before use in orchestration logic

## PR Gate

PRs must pass the repository PR checklist gate in `.github/pull_request_template.md`:
- contract/schema/workflow checkboxes are required for workflow-affecting changes
- author must mark N/A with explanation when gate items do not apply

## Consequences

Positive:
- reduced API/worker contract drift
- safer schema evolution and migration planning
- clearer review flow and auditability

Trade-off:
- slightly more upfront structure per change
- requires discipline in PR sequencing
