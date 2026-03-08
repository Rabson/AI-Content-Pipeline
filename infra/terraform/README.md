# Terraform Infrastructure

This directory now contains real AWS provider modules for the storage layer used by the AI Content Pipeline.

## Current Scope
- S3 asset bucket with:
  - versioning
  - server-side encryption
  - public access block
- least-privilege IAM user for application storage access
- shared environment/tag context module

## Module Layout
- `modules/context`
  - common naming and tags
- `modules/storage_bucket`
  - S3 bucket, versioning, encryption, and public access block
- `modules/storage_iam_user`
  - IAM user, access key, and scoped bucket policy

## What This Does Not Yet Manage
- Render services
- Vercel projects
- Sentry projects
- PostgreSQL or Redis managed services

Those deployment surfaces are still managed through service-local manifests and provider consoles.

## Apply Order
1. Review `variables.tf`
2. Create an environment-specific `.tfvars`
3. Run:

```bash
terraform init
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars
```

## Key Outputs
- `asset_bucket_name`
- `asset_bucket_arn`
- `asset_bucket_region`
- `publisher_user_name`
- `publisher_access_key_id`
- `publisher_secret_access_key`

Use the IAM access key outputs as the source for:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

in the API and worker runtimes.
