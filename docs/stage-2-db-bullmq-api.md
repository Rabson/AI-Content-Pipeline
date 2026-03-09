# Stage 2: DB Schema, BullMQ Jobs, API Endpoints

Source-of-truth note: business workflow and gating semantics referenced here are canonicalized in `docs/business-logic.md`.

## 1) PostgreSQL Schema (Prisma-oriented)

## `topics`
- Purpose: user-entered topic definitions.
- Columns:
  - `id` (uuid, pk)
  - `title` (text, not null)
  - `brief` (text)
  - `audience` (text)
  - `status` (enum `TopicStatus`)
  - `created_by` (text)
  - `created_at`, `updated_at`

## `content_items`
- Purpose: canonical content workflow entity per topic.
- Columns:
  - `id` (uuid, pk)
  - `topic_id` (fk -> `topics.id`, unique)
  - `current_state` (enum `ContentState`)
  - `active_draft_version` (int)
  - `approved_version` (int, nullable)
  - `locked_for_publish` (boolean default false)
  - `created_at`, `updated_at`

## `artifact_versions`
- Purpose: immutable versions for any major artifact.
- Columns:
  - `id` (uuid, pk)
  - `content_item_id` (fk)
  - `artifact_type` (enum: `RESEARCH`,`OUTLINE`,`DRAFT`,`SEO`,`SOCIAL`)
  - `version_number` (int)
  - `status` (enum: `ACTIVE`,`SUPERSEDED`,`FAILED`)
  - `payload_json` (jsonb)
  - `model` (text)
  - `prompt_hash` (text)
  - `created_at`
- Constraint: unique (`content_item_id`, `artifact_type`, `version_number`).

## `research_artifacts`
- Purpose: normalized research details tied to version.
- Columns: `id`, `artifact_version_id` (unique fk), `summary`, `key_points` (jsonb), `created_at`.

## `source_references`
- Purpose: evidence/citations used by research.
- Columns: `id`, `research_artifact_id` (fk), `url`, `title`, `snippet`, `source_type`, `credibility_score`.

## `outlines`
- Purpose: outline root record.
- Columns: `id`, `artifact_version_id` (unique fk), `title`, `objective`.

## `outline_sections`
- Purpose: section tree for outline and mapping key.
- Columns:
  - `id` (uuid)
  - `outline_id` (fk)
  - `section_key` (text, stable key e.g. `sec_intro`)
  - `parent_section_id` (nullable fk self)
  - `position` (int)
  - `heading` (text)
  - `intent` (text)
  - `target_words` (int)

## `drafts`
- Purpose: draft metadata for a specific version.
- Columns: `id`, `artifact_version_id` (unique fk), `title`, `excerpt`, `word_count_total`.

## `draft_sections`
- Purpose: section-level body and revision unit.
- Columns:
  - `id`
  - `draft_id` (fk)
  - `section_key` (text)
  - `heading` (text)
  - `body_md` (text)
  - `word_count` (int)
  - `changed_in_revision_id` (nullable fk)
- Constraint: unique (`draft_id`, `section_key`).

## `reviews`
- Purpose: review cycle records.
- Columns: `id`, `content_item_id` (fk), `draft_version` (int), `status` (`OPEN`,`SUBMITTED`,`CLOSED`), `reviewer_id`, `submitted_at`.

## `review_comments`
- Purpose: comments bound to specific section keys.
- Columns:
  - `id`
  - `review_id` (fk)
  - `section_key` (text)
  - `comment_md` (text)
  - `severity` (`NIT`,`MAJOR`,`BLOCKER`)
  - `status` (`OPEN`,`ADDRESSED`,`WONT_FIX`)

## `revisions`
- Purpose: run metadata for revision generation.
- Columns: `id`, `review_id` (fk), `from_draft_version` (int), `to_draft_version` (int nullable), `status`, `created_at`, `completed_at`.

## `revision_items`
- Purpose: selected sections for targeted revisions.
- Columns: `id`, `revision_id` (fk), `section_key`, `instruction_md`, `result_status`, `diff_json` (jsonb).

## `seo_metadata`
- Purpose: SEO payload for a content version.
- Columns: `id`, `artifact_version_id` (unique fk), `slug`, `meta_title`, `meta_description`, `tags` (text[]), `canonical_url`.

## `publications`
- Purpose: platform publication records.
- Columns:
  - `id`
  - `content_item_id` (fk)
  - `platform` (`DEVTO`)
  - `status` (`QUEUED`,`PUBLISHED`,`FAILED`)
  - `artifact_version_id` (fk approved draft)
  - `external_id` (text)
  - `external_url` (text)
  - `published_at`

## `publication_attempts`
- Purpose: retry/audit trail for publish calls.
- Columns: `id`, `publication_id` (fk), `attempt_no`, `request_json`, `response_json`, `error_message`, `created_at`.

## `social_posts`
- Purpose: generated social drafts by platform.
- Columns: `id`, `content_item_id` (fk), `platform` (`LINKEDIN`), `status` (`DRAFT`,`APPROVED`,`POSTED`), `active_version` (int).

## `social_post_versions`
- Purpose: immutable variants.
- Columns: `id`, `social_post_id` (fk), `version_number`, `body_text`, `hashtags` (text[]), `cta`, `created_at`.

## `workflow_events`
- Purpose: auditable state transitions.
- Columns: `id`, `content_item_id`, `event_type`, `from_state`, `to_state`, `actor`, `metadata_json`, `created_at`.

## `job_executions`
- Purpose: BullMQ execution logs.
- Columns: `id`, `queue_name`, `job_name`, `bull_job_id`, `status`, `attempt`, `payload_json`, `error`, `started_at`, `ended_at`.

## `llm_usage_logs`
- Purpose: cost and usage tracking.
- Columns: `id`, `content_item_id`, `module`, `model`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `cost_usd`, `created_at`.

## 2) BullMQ Queue and Job Design

## Queues
1. `content.pipeline`
2. `publishing`
3. `social`
4. `analytics`

## Jobs and payloads

### Queue: `content.pipeline`
- `research.run`
```json
{
  "contentItemId": "uuid",
  "topicId": "uuid",
  "requestedBy": "user_123"
}
```
- `outline.generate`
```json
{ "contentItemId": "uuid", "researchVersion": 1 }
```
- `draft.generate`
```json
{ "contentItemId": "uuid", "outlineVersion": 1, "styleProfile": "technical_pragmatic" }
```
- `revision.apply`
```json
{
  "contentItemId": "uuid",
  "reviewId": "uuid",
  "fromDraftVersion": 1,
  "sectionKeys": ["sec_intro", "sec_tradeoffs"]
}
```
- `seo.generate`
```json
{ "contentItemId": "uuid", "draftVersion": 2 }
```

### Queue: `publishing`
- `publish.devto`
```json
{
  "contentItemId": "uuid",
  "draftVersion": 2,
  "seoVersion": 1,
  "idempotencyKey": "content_uuid_v2_devto"
}
```

### Queue: `social`
- `social.linkedin.generate`
```json
{ "contentItemId": "uuid", "sourceDraftVersion": 2, "variantCount": 3 }
```

### Queue: `analytics`
- `analytics.rollup.daily`
```json
{ "date": "2026-03-07" }
```

## Retry and failure policies
- LLM generation jobs: `attempts=3`, exponential backoff 30s/2m/10m, fail to dead-letter after max.
- Publish jobs: `attempts=5`, fixed backoff 60s; classify 4xx non-retriable (except 429).
- Dead-letter behavior: write `job_executions` + alert Sentry + flag content state `FAILED` where applicable.
- Idempotency:
  - Use deterministic `jobId` (`${contentItemId}:${jobName}:${version}`).
  - Publishing uses explicit idempotency key persisted in DB.

## Sync vs Async boundary
- Sync (HTTP): topic CRUD, review comment CRUD, approvals, fetching artifacts/diffs.
- Async (BullMQ): research, outline, draft, revision, SEO generation, publish, social generation, analytics rollups.

## 3) API Endpoint Design (REST)

## Topic
- `POST /v1/topics`
- `GET /v1/topics?status=&q=&page=`
- `GET /v1/topics/:topicId`

Example `POST /v1/topics` request:
```json
{
  "title": "Node.js Backpressure in Queue-Based Systems",
  "brief": "Explain practical patterns with BullMQ and retries.",
  "audience": "Senior backend engineers",
  "tags": ["nodejs", "bullmq", "architecture"]
}
```

## Research
- `POST /v1/topics/:topicId/research/run`
- `GET /v1/topics/:topicId/research`

## Outline
- `POST /v1/topics/:topicId/outline/generate`
- `GET /v1/topics/:topicId/outline`

## Draft
- `POST /v1/topics/:topicId/draft/generate`
- `GET /v1/topics/:topicId/draft?version=`
- `GET /v1/topics/:topicId/draft/sections/:sectionKey`

## Review
- `POST /v1/drafts/:draftId/reviews`
- `POST /v1/reviews/:reviewId/comments`
- `PATCH /v1/reviews/:reviewId/comments/:commentId`
- `POST /v1/reviews/:reviewId/submit`

Comment request:
```json
{
  "sectionKey": "sec_intro",
  "severity": "MAJOR",
  "commentMd": "Clarify when to choose fixed vs exponential backoff."
}
```

## Revision
- `POST /v1/reviews/:reviewId/revisions/run`
- `GET /v1/drafts/:draftId/diff?fromVersion=1&toVersion=2`

Revision request:
```json
{
  "items": [
    {
      "sectionKey": "sec_intro",
      "instructionMd": "Add concrete production incident example and remediation steps."
    }
  ]
}
```

## Approval
- `POST /v1/content/:contentItemId/approve`
- `POST /v1/content/:contentItemId/unapprove`

## SEO
- `POST /v1/content/:contentItemId/seo/generate`
- `GET /v1/content/:contentItemId/seo`

## Publishing
- `POST /v1/content/:contentItemId/publish/devto`
- `GET /v1/content/:contentItemId/publications`

## Social
- `POST /v1/content/:contentItemId/social/linkedin/generate`
- `GET /v1/content/:contentItemId/social/linkedin`
- `PATCH /v1/social-posts/:socialPostId/status`

## Analytics (phase 3)
- `GET /v1/analytics/overview?from=&to=`
- `GET /v1/analytics/topics/:contentItemId`

## Error model (uniform)
```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot publish when content state is DRAFT_READY",
    "details": { "requiredState": "APPROVED" }
  }
}
```
