## Summary

<!-- What changed and why -->

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`

## Contract/Schema Workflow Gate (Required for workflow-affecting changes)

If this PR changes workflow behavior, queue payloads, status transitions, or persistence shape, all applicable items must be checked.

- [ ] Updated shared API/domain contracts in `@aicp/contracts` (or N/A with reason below)
- [ ] Updated shared queue payload contracts in `@aicp/queue-contracts` (or N/A with reason below)
- [ ] Updated Prisma schema/migration intent before API/worker logic changes (or N/A with reason below)
- [ ] Updated workflow transition maps/tests in `@aicp/workflow-core` (or N/A with reason below)
- [ ] API/worker logic follows contract/schema updates (no ad-hoc payload or state additions)

N/A reasons (required when any item above is unchecked):

<!-- Explain why each unchecked item is not applicable -->

## Risk and Rollback

- Risk level: low / medium / high
- Rollback approach:
  - 
