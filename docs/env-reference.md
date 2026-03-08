# Environment Reference

This file is the service-by-service environment reference.

## API
- `APP_ENV`: runtime mode (`local`, `staging`, `production`)
- `NODE_ENV`: Node runtime mode
- `PORT`: API port
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `QUEUE_PREFIX`: BullMQ prefix
- `AUTH_ALLOW_HEADER_BYPASS`: local-only auth bypass toggle
- `INTERNAL_SERVICE_JWT_SECRET`: shared secret for dashboard -> API service token signing
- `INTERNAL_SERVICE_JWT_ISSUER`: expected dashboard token issuer
- `INTERNAL_SERVICE_JWT_AUDIENCE`: expected API token audience
- `INTERNAL_SERVICE_JWT_CLOCK_SKEW_SECONDS`: allowed service-token clock skew
- `API_CORS_ORIGINS`: allowed browser origins, comma-separated
- `API_REQUEST_BODY_LIMIT`: request size limit, for example `1mb`
- `DISCOVERY_HN_API_BASE_URL`: Hacker News provider base URL
- `DISCOVERY_ALLOWED_HOSTS`: allowed discovery hosts, comma-separated
- `EXTERNAL_REQUEST_TIMEOUT_MS`: default outbound timeout
- `OPENAI_API_KEY`: OpenAI key
- `OPENAI_MODEL_DRAFT`: draft/revision/outline model
- `OPENAI_MODEL_RESEARCH`: research model
- `DEVTO_API_KEY`: Dev.to publish key
- `MEDIUM_API_BASE_URL`: Medium publish API base URL
- `LINKEDIN_API_BASE_URL`: LinkedIn API base URL
- `LINKEDIN_API_VERSION`: LinkedIn version header value for publish calls
- `WORKER_HEALTH_BASE_URL`: worker health endpoint base URL for ops aggregation
- `SECURITY_ALERT_THRESHOLD`: repeated auth failure threshold
- `SECURITY_ALERT_WINDOW_MS`: threshold window
- `AUTH_LOCKOUT_THRESHOLD`: failed login attempts before temporary account lockout
- `AUTH_LOCKOUT_WINDOW_MS`: lockout duration window
- `USER_TOKEN_ENCRYPTION_KEY`: symmetric key seed used to encrypt publisher tokens
- `USER_TOKEN_ENCRYPTION_KEY_VERSION`: active encryption key version for credential rotation and re-encryption
- `STORAGE_PROVIDER`: `s3` or `r2`
- `STORAGE_BUCKET`: object bucket
- `STORAGE_ENDPOINT`: S3/R2 endpoint override
- `STORAGE_PUBLIC_BASE_URL`: public asset base URL
- `STORAGE_FORCE_PATH_STYLE`: path-style S3 toggle
- `STORAGE_ALLOWED_MIME_TYPES`: allowed upload mime types
- `STORAGE_MAX_UPLOAD_BYTES`: upload size cap
- `AWS_ACCESS_KEY_ID`: storage access key
- `AWS_SECRET_ACCESS_KEY`: storage secret
- `AWS_REGION`: storage region
- `OTEL_ENABLED`: enable OpenTelemetry export
- `OTEL_SERVICE_NAMESPACE`: OTel service namespace
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP base endpoint
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`: OTLP traces endpoint override
- `OTEL_EXPORTER_OTLP_HEADERS`: OTLP headers
- `OTEL_LOG_LEVEL`: OTel SDK log level

## Worker
- `APP_ENV`
- `NODE_ENV`
- `REDIS_URL`
- `QUEUE_PREFIX`
- `WORKER_METRICS_PORT`: worker health/metrics HTTP port
- `USER_TOKEN_ENCRYPTION_KEY`: must match API so publish jobs can decrypt stored publisher tokens
- `MEDIUM_API_BASE_URL`: Medium publish API base URL
- `LINKEDIN_API_BASE_URL`: LinkedIn API base URL
- `LINKEDIN_API_VERSION`: LinkedIn version header value for publish calls

## Dashboard
- `NEXT_PUBLIC_APP_ENV`: dashboard runtime mode
- `INTERNAL_API_BASE_URL`: server-side API base for Docker/internal calls
- `API_BASE_URL`: optional server-side API base override
- `NEXT_PUBLIC_API_BASE_URL`: browser API base
- `NEXTAUTH_URL`: NextAuth base URL
- `NEXTAUTH_SECRET`: NextAuth session secret
- `AUTH_RATE_LIMIT_MAX_ATTEMPTS`: sign-in attempt threshold
- `AUTH_RATE_LIMIT_WINDOW_MS`: sign-in rate-limit window
- `REDIS_URL`: optional Redis connection for shared sign-in throttling
- `INTERNAL_SERVICE_JWT_SECRET`: shared secret used to sign dashboard -> API bearer tokens
- `INTERNAL_SERVICE_JWT_ISSUER`: dashboard token issuer
- `INTERNAL_SERVICE_JWT_AUDIENCE`: API token audience
- `INTERNAL_SERVICE_JWT_TTL_SECONDS`: signed token lifetime
- `SESSION_MAX_AGE_SECONDS`: dashboard session lifetime
- `NEXT_PUBLIC_FEATURE_PHASE2_ENABLED`: phase-2 UI toggle
- `NEXT_PUBLIC_FEATURE_PHASE3_ENABLED`: phase-3 UI toggle
- `NEXT_DIST_DIR`: Next build directory override

## Local-only Notes
- `.env` at repo root is the local runtime source.
- `.env.example` is structure only.
- Local seeded users:
  - `admin@example.com` / `AdminPass123!`
  - `editor@example.com` / `EditorPass123!`
  - `reviewer@example.com` / `ReviewerPass123!`
  - `normal_user@example.com` / `UserPass123!`
- Local Docker and host-process startup are documented in [RUN.md](../RUN.md).
- Approved content is assigned to `normal_user@example.com` in the seed flow unless reassigned by `ADMIN`.
