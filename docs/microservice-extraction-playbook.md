# Microservice Extraction Playbook

This playbook defines the first extraction candidate and a rollback-safe carve-out sequence.

## First Candidate

Service: `Research`

Why first:
1. Clear input boundary (`approved topic` + source hints).
2. Clear output boundary (structured research artifact JSON).
3. Mostly async and queue-driven, which reduces synchronous coupling risk.
4. Limited UI coupling compared with topic/draft/publisher domains.

## Target Boundaries

Owned domain:
- research orchestration and LLM calls
- research artifact persistence (`ResearchArtifact`, `SourceReference`, `ResearchKeyPoint`, `ResearchExample`)
- read APIs for research artifact versions

Consumed contracts:
- topic read contract (`topicId`, title, brief, audience, source URLs)
- queue contract (`research.run` payload)
- workflow event contract for run lifecycle

## Carve-Out Steps

1. Contract Freeze
- freeze queue and API payloads used by research
- pin contract version and document compatibility window

2. Read/Write Split in Monolith
- route all research writes behind research module interfaces
- remove non-research direct writes to research tables

3. Data Isolation Preparation
- define research-owned schema segment
- add migration scripts for moving research tables if needed
- add read replicas or projection strategy for dashboard queries

4. Runtime Separation
- deploy a standalone research service process
- subscribe it to research queue jobs
- keep API as the public entrypoint and proxy internal requests as needed

5. Traffic Shift
- move worker research execution from monolith module to extracted service
- run shadow mode first (double process, single writer disabled)
- enable single-writer mode when outputs match

6. Rollback Plan
- keep old monolith research runner behind feature flag
- if extraction fails, flip runner flag back and replay failed jobs
- preserve idempotency keys to avoid duplicate artifact writes

7. Post-Extraction Cleanup
- remove monolith-only research execution code
- keep research contracts in shared package
- update CI compatibility gates and runbooks

## Compatibility and Safety Gates

Before cutover:
1. API and worker pass queue contract compatibility checks.
2. Service smoke builds pass for API, worker, dashboard, and research service branch.
3. Replay runbook validated for research failure scenarios.
4. Observability has trace/request correlation across enqueue and worker execution.
