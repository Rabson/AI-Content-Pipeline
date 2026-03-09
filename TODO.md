# TODO - AI Content Pipeline

Status: validated against current code on 2026-03-09 (pending items only).

## Pending Items

### API

1. Add HTTP request/response integration specs (not metadata-only reflection checks) for controllers still lacking endpoint-level transport coverage:
   - `analytics`
   - `discovery`
   - `draft`
   - `outline`
   - `research`
   - `revision`
   - `seo`
   - `social`
   - `storage`
   - `system`
   - `ops`
   - `workflow`
   - `user`
   - `user-publisher-credential`

### Dashboard

1. Add route-level page specs for untested topic sub-pages:
   - `/topics/[topicId]/draft`
   - `/topics/[topicId]/history`
   - `/topics/[topicId]/outline`
   - `/topics/[topicId]/research`
   - `/topics/[topicId]/review`
   - `/topics/[topicId]/revisions`
2. Add auth integration tests for NextAuth proxy behavior:
   - unauthenticated users are redirected to `/signin`
   - authenticated users can access protected routes
3. Add authorization tests on sensitive dashboard actions:
   - owner reassignment/publish actions for `ADMIN` vs non-`ADMIN`
4. Expand API-failure UI tests for topic sub-pages listed above.

### Security / Platform

1. Add CI optional stage for Docker runtime parity (`make smoke-docker`).

## Priority Order

### P0

1. Add Dashboard page specs for the six missing topic sub-pages.
2. Add dashboard proxy auth integration tests (redirect/pass-through).
3. Add endpoint-level API integration specs for uncovered controllers.

### P1

1. Add dashboard authorization tests for sensitive actions (`ADMIN` vs non-`ADMIN`).
2. Expand API-failure UI tests for topic sub-pages.

### P2

1. Add optional CI stage for `make smoke-docker`.
