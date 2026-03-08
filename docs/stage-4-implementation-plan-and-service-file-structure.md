# Stage 4: Implementation Plan Per Phase + Service-by-Service File Structure

## 1) Implementation Plan

## Phase 1: Core content pipeline
Scope:
- Topic -> Research -> Outline -> Draft -> Review -> Section revision -> Approval
- Dashboard for core editing and review
- Versioning and workflow state machine

Implemented surfaces:
1. Foundation
   - monorepo setup, lint/typecheck/test pipelines
   - shared contracts in `packages/contracts` and `packages/queue-contracts`
   - API-local publisher contracts in `apps/api/src/modules/publisher/contracts`
   - shared env/tooling config in `packages/shared-config`
   - shared backend runtime primitives in `packages/backend-core`
2. Data layer
   - Prisma schema and committed migration
3. API baseline
   - auth, topics CRUD, workflow reads, discovery, research, outline, draft, revision, ops
4. Worker baseline
   - BullMQ setup, job execution logging, health/metrics server
5. Generation pipeline
   - discovery import, research, outline, draft, revision, SEO, social, publish, analytics rollup jobs
6. Review and revision
   - comment model, revision targeting by `section_key`, diff API
7. Approval guard
   - state transition enforcement and audit events
8. Dashboard
   - topics list, research, outline, draft editor, review panel, revision diff, analytics, ops

## Phase 2: Publishing + social distribution
Scope:
- Dev.to publish integration
- LinkedIn draft generation and approval flow
- publication history UI

Current implemented direction:
1. SEO metadata generation
2. Dev.to adapter + publish queue
3. Publish audit tables + retries + idempotency hooks
4. LinkedIn draft generator + status management
5. Dashboard publish/history views

## Phase 3: Analytics + topic discovery
Scope:
- operational/content analytics
- topic discovery suggestions and provider imports

Current implemented direction:
1. LLM usage and lifecycle aggregation
2. analytics APIs + dashboard charts
3. discovery module with manual intake and provider import
4. ops/runtime monitoring for queues and failed jobs

## 2) Service-by-Service File Structure

## `apps/api`
```text
apps/api/
  Dockerfile
  Dockerfile.dockerignore
  render.yaml
  render.staging.yaml
  src/
    main.ts
    app.module.ts
    config/
      env.ts
      feature-flags.ts
    common/
      auth/
      decorators/
      filters/
      guards/
      interceptors/
      interfaces/
      llm/
      logger/
      observability/
    modules/
      analytics/
      discovery/
      draft/
      ops/
      outline/
      publisher/
      research/
      revision/
      seo/
      social/
      storage/
      system/
      topic/
      workflow/
    prisma/
      schema.prisma
      migrations/
  test/
    e2e/
    integration/
```

## `apps/worker`
```text
apps/worker/
  Dockerfile
  Dockerfile.dockerignore
  render.yaml
  render.staging.yaml
  src/
    main.ts
    worker.module.ts
    config/
      env.ts
    processors/
      analytics.processor.ts
      content-pipeline.processor.ts
      discovery.processor.ts
      draft.processor.ts
      outline.processor.ts
      publish.processor.ts
      research.processor.ts
      revision.processor.ts
      seo.processor.ts
      social.processor.ts
    support/
      health/
      job-execution.service.ts
      opentelemetry.ts
      retry-policy.service.ts
      worker-health.service.ts
      worker-metrics.service.ts
```

## `apps/dashboard`
```text
apps/dashboard/
  Dockerfile
  Dockerfile.dockerignore
  next.config.ts
  vercel.json
  src/
    app/
      analytics/
      api/auth/
      ops/
      signin/
      topics/
    components/
      analytics/
      auth/
      home/
      review/
      shared/
      shell/
      topic-detail/
    config/
      env.ts
    lib/
      api-client/
      auth.ts
      backend-client.ts
      error-display.ts
      formatting.ts
    types/
```

## `packages/contracts`
```text
packages/contracts/
  src/
    api.ts
    blog-document.ts
    blog-document.blocks.ts
    blog-document.enums.ts
    blog-document.metadata.ts
    blog-document-export.ts
    blog-document.schema.json
    index.ts
```

## `packages/queue-contracts`
```text
packages/queue-contracts/
  src/
    index.ts
    job-constants.ts
    job-payloads.ts
    job-payloads/
      content-pipeline.ts
      distribution.ts
    jobs.ts
```

## `apps/api/src/modules/publisher/contracts`
```text
apps/api/src/modules/publisher/contracts/
  publisher.contract.ts
```

## `packages/auth-core`
```text
packages/auth-core/
  src/
    base64url.ts
    service-token.ts
    index.ts
```

## `packages/observability-core`
```text
packages/observability-core/
  src/
    telemetry-config.ts
    telemetry-runtime.ts
    index.ts
```

## `packages/workflow-core`
```text
packages/workflow-core/
  src/
    transitions.ts
    index.ts
```

## `packages/backend-core`
```text
packages/backend-core/
  src/
    index.ts
    logger/
    prisma/
    security/
```

## `packages/shared-config`
```text
packages/shared-config/
  env/
    readers.ts
  eslint/
    base.cjs
    nest.cjs
    next.cjs
  tsconfig/
    base.json
  tsconfig.json
  package.json
```

## `infra`
```text
infra/
  docker/
    compose.base.yml
    compose.local.yml
    docker-compose.staginglike.yml
  terraform/
    README.md
```

## `.github/workflows`
```text
.github/workflows/
  ci.yml
  deploy-api-worker.yml
  deploy-dashboard.yml
  migrate.yml
  sentry-release.yml
```

## 3) Execution Guidelines
- Keep all module APIs idempotent where jobs can retry.
- Keep service-local env access centralized in each app's `src/config/env.ts`.
- Keep transition guards in `workflow`; other modules request transitions rather than bypassing workflow state.
- Never mutate prior artifact versions.
- Keep local Docker concerns in `infra/docker`, but keep each service's image spec beside the service.
- Add integration tests for every state transition and publish gate.
