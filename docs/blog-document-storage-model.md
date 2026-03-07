# Blog Document Storage and Export Model

## Purpose
The `BlogDocument` schema is the final assembled content contract for export, API delivery, and publication adapters. It is not the primary relational storage model.

## Source of Truth in Current Prisma Schema
- `Topic`: root metadata such as `id`, `title`, `summary` from `brief`, `slug`, lifecycle status, tags, timestamps.
- `DraftVersion`: export version and assembled markdown snapshot.
- `DraftSection`: ordered section source for the assembled `sections[]` payload.
- `ResearchArtifact`, `SourceReference`, `ResearchKeyPoint`, `ResearchExample`: supporting research context used during assembly, not embedded as first-class blog fields unless needed in transforms.
- `SeoMetadata`: `seo` block and canonical fields.
- `SocialPost` + `SocialPostVersion`: `platformTransforms.linkedin` source.
- `Publication` + `PublicationAttempt`: publication history, not part of the core blog document body.

## Recommended Assembly Rules
- Assemble the root document from `Topic` + current approved `DraftVersion`.
- Convert each `DraftSection` into one `Section` object.
- Preserve section order from `DraftSection.position`.
- Use `DraftVersion.versionNumber` as the blog document `version`.
- Use `DraftVersion.status` and review state to derive document-level status for export.
- Populate `seo` only when `SeoMetadata` exists.
- Populate `platformTransforms` only when a transform artifact exists for that platform.

## Fields That Should Stay Out of Primary DB Storage
- Render-only block arrays for the entire blog document.
- Presentation-only transforms that can be regenerated.
- Denormalized export snapshots unless you intentionally version exported payloads.

## Recommended Persistence Strategy
- Keep normalized pipeline tables as the source of truth.
- Generate `BlogDocument` on demand for preview/export.
- Optionally store immutable export snapshots in object storage or an `EXPORT` storage object for publication audit.
