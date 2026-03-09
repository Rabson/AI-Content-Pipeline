# Service Data Ownership and Migration Roadmap

This document defines table ownership boundaries for future microservice extraction and the migration sequence from the current modular monolith database.

## Ownership Map (Current Target)

### Topic Service
- `Topic`
- `TopicStatusHistory`
- `TopicTag`
- `ContentItem` (state lifecycle anchor)

### Discovery Service
- `Topic` (create/update candidate topics through Topic service APIs only)
- `TopicTag` (through Topic service APIs)
- No direct ownership of shared tables

### Research Service
- `ArtifactVersion` where `artifactType = RESEARCH`
- `ResearchArtifact`
- `SourceReference`
- `ResearchKeyPoint`
- `ResearchExample`

### Outline Service
- `ArtifactVersion` where `artifactType = OUTLINE`
- `Outline`
- `OutlineSection`

### Draft and Review Service
- `ArtifactVersion` where `artifactType = DRAFT`
- `DraftVersion`
- `DraftSection`
- `ReviewSession`
- `ReviewComment`
- `RevisionRun`
- `RevisionItem`
- `SectionDiff`

### SEO Service
- `ArtifactVersion` where `artifactType = SEO`
- `SeoMetadata`

### Social and Publisher Service
- `SocialPost`
- `SocialPostVersion`
- `Publication`
- `PublicationAttempt`

### User and Auth Service
- `User`
- `UserPublisherCredential`
- `UserPublisherCredentialAudit`
- `SecurityEvent`

### Workflow and Ops Service
- `WorkflowRun`
- `WorkflowEvent`
- `JobExecution`
- `LlmUsageLog`
- `AnalyticsDailyUsage`
- `AnalyticsDailyOverview`
- `StorageObject`

## Split Rules

1. Each service can write only to owned tables.
2. Cross-domain writes must happen via API/queue contracts, never direct table writes.
3. Read-only joins across domains are allowed only in API composition layers and should be progressively replaced with projection/read models.
4. `ArtifactVersion` remains shared physically for now, but logically partitioned by `artifactType` ownership.

## Migration Roadmap

### Phase A: Contract and ownership lock
1. Freeze contract versions for API and queue payloads.
2. Add ownership annotations in repositories (code comments + docs).
3. Add boundary tests to block forbidden direct writes.

### Phase B: Isolate write paths
1. Route all cross-domain writes through service APIs or internal worker endpoints.
2. Remove remaining direct cross-module repository imports.
3. Add idempotency keys and replay guards on every async boundary.

### Phase C: Create read models
1. Build service-local projections for dashboard/ops views.
2. Reduce cross-domain query joins in request path.
3. Backfill projections from workflow events.

### Phase D: Extract first service
1. Start with `Research` extraction (narrow write surface, clear inputs/outputs).
2. Move research-owned tables or provide a dedicated database/schema boundary.
3. Deploy with compatibility gates and rollback runbook.

### Phase E: Continue extraction sequence
1. `Publisher`/`Social`
2. `Draft`/`Revision`
3. `Topic` core

This order minimizes blast radius by extracting downstream processors before upstream topic orchestration.
