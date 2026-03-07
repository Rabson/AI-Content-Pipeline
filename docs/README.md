# Docs Index

This folder holds the detailed reference material.
It should not repeat the role of `README.md`, `RUN.md`, or `summary.md`.

## File Ownership
- [README.md](../README.md)
  - repo entry point
  - high-level project overview
  - where to find things
- [RUN.md](../RUN.md)
  - local runtime commands only
  - startup, verification, shutdown
- [summary.md](../summary.md)
  - product/system brief
  - goals, workflow, constraints, module intent
- `docs/*`
  - detailed design, runbooks, and reference material

## Docs In This Folder
- [docker-local-commands.md](./docker-local-commands.md)
  - Docker-specific local commands and smoke checks
- [local-runtime-and-discovery-flow.md](./local-runtime-and-discovery-flow.md)
  - verified local flow from discovery through research handoff
- [stage-1-system-overview-architecture-core-modules.md](./stage-1-system-overview-architecture-core-modules.md)
  - system overview, architecture, core modules
- [stage-2-db-bullmq-api.md](./stage-2-db-bullmq-api.md)
  - schema, queue, and API design
- [stage-3-monorepo-infra-cicd-deployment.md](./stage-3-monorepo-infra-cicd-deployment.md)
  - monorepo, infra, CI/CD, deployment
- [stage-4-implementation-plan-and-service-file-structure.md](./stage-4-implementation-plan-and-service-file-structure.md)
  - implementation phases and file structure
- [blog-document-storage-model.md](./blog-document-storage-model.md)
  - final assembled blog document mapping
- [code-shape-rules.md](./code-shape-rules.md)
  - structure and lint expectations
- [branch-protection-policy.md](./branch-protection-policy.md)
  - repository protection policy

## Rule
If content belongs in one of the root docs, link to it instead of duplicating it here.
