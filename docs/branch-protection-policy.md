# Branch Protection Policy

Required checks for `main`:

- `CI / ci`
- `Deploy Dashboard / deploy-dashboard` on dashboard changes
- `Deploy API and Worker / deploy` on backend/infra changes

Recommended repository rules:

- Require pull request before merging.
- Require at least 1 approving review.
- Dismiss stale approvals when new commits land.
- Require branches to be up to date before merge.
- Restrict force-pushes and deletion on `main`.
- Require conversation resolution before merge.

Operational rule:

- Database migrations run only through the protected `Migrate Database` workflow with environment approval.
- PRs must use `.github/pull_request_template.md` and satisfy the Contract/Schema Workflow Gate for any workflow-affecting change.
