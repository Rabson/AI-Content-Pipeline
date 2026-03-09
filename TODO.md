# TODO - AI Content Pipeline

Status: pending items only.

## Pending Items

### API

1. Add controller-level transport integration coverage for routes not explicitly covered with dedicated integration specs:
   - `analytics`, `discovery`, `draft`, `outline`, `publisher`, `research`, `revision`, `seo`, `social`, `storage`, `system`, `user`, `user-publisher-credential`.

### Dashboard

1. Add route-level page specs for currently untested topic sub-pages:
   - `/topics/[topicId]/draft`
   - `/topics/[topicId]/history`
   - `/topics/[topicId]/outline`
   - `/topics/[topicId]/research`
   - `/topics/[topicId]/review`
   - `/topics/[topicId]/revisions`
2. Add auth/authorization integration tests:
   - unauthenticated redirect behavior
   - role-based access on sensitive actions
3. Expand API-failure UI tests for topic sub-pages listed above.

### Security / Platform

1. Add CI optional stage for Docker runtime parity (`make smoke-docker`).
2. Decide Terraform ownership scope for managed DB/Redis/service infra vs external ownership.

### Architecture / Workflow

1. Adopt and document a `contract-first + database-first` implementation flow:
   - define workflow contracts first (state machine + queue payload schemas)
   - map contracts to Prisma models and DB constraints
   - enforce API/worker implementation only after migration + contract update
2. Add an ADR for service build order:
   - `contracts -> prisma schema/migrations -> API services/controllers -> workers -> dashboard`
3. Add a checklist gate in PR template (or CI policy doc) requiring contract/schema changes to land before workflow logic changes.

## Priority Order

### P0

1. Adopt and document `contract-first + database-first` workflow with ADR + checklist gate.

### P1

2. Add Dashboard coverage for remaining topic sub-page routes.
3. Add Dashboard auth/authorization integration tests.
4. Add dedicated API controller integration specs for uncovered controllers.

## P2

1. Add optional CI stage for `make smoke-docker`.
2. Finalize Terraform ownership scope.
