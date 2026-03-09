# Reliability: Idempotency, DLQ, and Replay

## Idempotency Standard

All enqueue paths attach:
- `contractVersion`
- `idempotencyKey`

Implementation detail:
- API producers use `withQueueContractEnvelope(...)` from `@aicp/queue-contracts`.
- The idempotency key is derived from deterministic job IDs (`buildQueueJobId(...)`).
- Worker internal HTTP transport also carries `contractVersion`.

## Queue Contract Compatibility

- Current supported version: `1`
- Legacy payloads without `contractVersion` are treated as version `1`.
- Unsupported versions fail fast in workers and internal API worker endpoints.

Key validation points:
- Worker processors call `assertSupportedQueueContractVersion(job.data)`.
- API worker endpoints call `assertWorkerContractVersion(body)`.

## Failure Handling and DLQ Posture

- Retry policy classifies transient vs non-retryable failures.
- Non-retryable failures call `job.discard()` to stop retry loops.
- Execution outcomes are persisted in `job_executions`.
- Module-specific failure writers update draft/revision/outline failure state.

Current posture is a logical DLQ via `FAILED` execution ledger plus replay controls.
If needed, this can be extended to a physical BullMQ dead-letter queue later.

## Replay Safety Checks

Replay endpoint (`POST /v1/ops/failed-jobs/:executionId/replay`) now enforces:
1. Only `FAILED` executions are replayable.
2. Deterministic replay job ID (`replay:<queue>:<job>:<executionId>`).
3. Existing replay job reuse (idempotent replay response).
4. Rate limiting at controller layer.

## Operator Runbook

1. Inspect failed execution via ops endpoint.
2. Validate root cause and confirm transient or corrected permanent issue.
3. Trigger replay.
4. Verify new execution status and related workflow events.
5. If replay fails repeatedly:
   - patch producer payload/input data
   - or manually recover artifact/status and close incident

## Next Hardening Steps

1. Add optional physical DLQ queue per domain.
2. Add replay-attempt cap per execution ID.
3. Add replay audit reason code in request payload.
4. Surface correlation IDs in dashboard ops views.
