# Stage 4: Implementation Plan Per Phase + Service-by-Service File Structure

## 1) Implementation Plan

## Phase 1: Core content pipeline (must ship first)
Scope:
- Topic -> Research -> Outline -> Draft -> Review -> Section revision -> Approval
- Dashboard for core editing/review
- Versioning and workflow state machine

Build order:
1. Foundation
   - monorepo setup, lint/typecheck/test pipelines
   - shared enums (`ContentState`, `ArtifactType`)
2. Data layer
   - Prisma schema + migrations for core tables
3. API baseline
   - auth, topics CRUD, content state read APIs
4. Worker baseline
   - BullMQ setup + job execution logging
5. Generation pipeline
   - research, outline, draft jobs and endpoints
6. Review + revision
   - comment model, revision targeting by `section_key`, diff API
7. Approval guard
   - state transition enforcement and audit events
8. Dashboard v1
   - topics list, research, outline, draft editor, review panel, revision diff

Exit criteria:
- One topic can complete full cycle to `APPROVED` with at least one revision loop.

## Phase 2: Publishing + social distribution
Scope:
- Dev.to publish integration
- LinkedIn draft generation and approval
- publication history UI

Build order:
1. SEO metadata generation
2. Dev.to adapter + publish queue
3. Publish audit tables + retries + idempotency
4. LinkedIn draft generator + status management
5. Dashboard publish screen + history

Exit criteria:
- Approved content publishes to Dev.to and stores canonical external URL.
- LinkedIn drafts generated and manually approved.

## Phase 3: Analytics + topic discovery
Scope:
- operational/content analytics
- topic discovery suggestions (assistive)

Build order:
1. LLM usage and cycle-time aggregation jobs
2. analytics APIs + dashboard charts
3. discovery module (suggested topics from trends/internal history)
4. additional platform-ready publisher abstraction

Exit criteria:
- Daily analytics rollup visible in dashboard.
- Operators can pick from suggested topics.

## 2) Service-by-Service File Structure

## `apps/api`
```text
apps/api/
  src/
    main.ts
    app.module.ts
    common/
      auth/
      filters/
      interceptors/
      guards/
      decorators/
      logger/
    infra/
      prisma/
        prisma.module.ts
        prisma.service.ts
      queue/
        queue.module.ts
        queue.service.ts
      openai/
        openai.client.ts
      devto/
        devto.client.ts
      storage/
        storage.service.ts
    modules/
      topic/
        topic.module.ts
        topic.controller.ts
        topic.service.ts
        topic.repository.ts
        dto/
      research/
        research.module.ts
        research.controller.ts
        research.service.ts
      outline/
      draft/
      review/
      revision/
      seo/
      publisher/
      social/
      workflow/
      analytics/
    prisma/
      schema.prisma
      migrations/
  test/
    integration/
    e2e/
```

## `apps/worker`
```text
apps/worker/
  src/
    main.ts
    worker.module.ts
    common/
      logger/
      telemetry/
    infra/
      prisma/
      queue/
      openai/
      devto/
    jobs/
      research.job.ts
      outline.job.ts
      draft.job.ts
      revision.job.ts
      seo.job.ts
      publish-devto.job.ts
      social-linkedin.job.ts
      analytics-rollup.job.ts
    processors/
      content-pipeline.processor.ts
      publishing.processor.ts
      social.processor.ts
      analytics.processor.ts
    orchestrator/
      workflow-transition.service.ts
    usage/
      llm-usage.service.ts
  test/
    jobs/
    integration/
```

## `apps/dashboard`
```text
apps/dashboard/
  src/
    app/
      (auth)/
      topics/
        page.tsx
        [topicId]/
          research/page.tsx
          outline/page.tsx
          draft/page.tsx
          review/page.tsx
          revisions/page.tsx
          publish/page.tsx
          history/page.tsx
      analytics/
        page.tsx
    components/
      topics/
      research/
      outline/
      draft/
      review/
      revisions/
      publish/
      analytics/
      shared/
    lib/
      api-client.ts
      auth.ts
      validators.ts
      formatting.ts
    styles/
      globals.css
  public/
```

## `packages/shared-types`
```text
packages/shared-types/
  src/
    enums/
      content-state.ts
      artifact-type.ts
      review.ts
      jobs.ts
    dto/
      topic.dto.ts
      review.dto.ts
      publish.dto.ts
    schemas/
      api-error.schema.ts
      job-payload.schema.ts
    index.ts
```

## `packages/shared-config`
```text
packages/shared-config/
  eslint/
    base.js
    nest.js
    next.js
  tsconfig/
    base.json
    nest.json
    next.json
  env/
    env.schema.ts
```

## `infra`
```text
infra/
  docker/
    docker-compose.yml
    api.Dockerfile
    worker.Dockerfile
    dashboard.Dockerfile
  render/
    render-api.yaml
    render-worker.yaml
  terraform/
    README.md
```

## `.github/workflows`
```text
.github/workflows/
  ci.yml
  deploy-dashboard.yml
  deploy-api-worker.yml
  migrate-prod.yml
```

## 3) Execution Guidelines

- Keep all module APIs idempotent where jobs can retry.
- Put transition guards in `workflow` module only; other modules request transitions.
- Never mutate prior artifact versions.
- Use feature flags for phase-2/3 screens and jobs until stable.
- Add integration tests for every state transition and publish gate.
