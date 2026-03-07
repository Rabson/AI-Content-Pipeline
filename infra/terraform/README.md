# Terraform Starter

This directory is the starter IaC surface for the AI Content Pipeline.

## Intended managed resources
- Render web service for `apps/api`
- Render worker service for `apps/worker`
- Vercel project(s) for `apps/dashboard`
- Managed PostgreSQL
- Managed Redis
- S3 or Cloudflare R2 bucket for assets
- Sentry projects and environment tags

## Suggested apply order
1. Storage bucket + IAM/API tokens
2. Postgres + Redis
3. Render API + worker services
4. Vercel preview/staging/production projects
5. Sentry environments and release integration

## Files
- `providers.tf`: provider declarations
- `variables.tf`: environment-specific inputs
- `main.tf`: starter modules/resources
- `outputs.tf`: service URLs and identifiers

This is intentionally starter-level. Replace placeholder resources with provider-specific modules for your account.
