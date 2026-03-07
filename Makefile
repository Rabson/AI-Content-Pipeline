SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE_FILE := infra/docker/docker-compose.yml
STAGINGLIKE_COMPOSE_FILE := infra/docker/docker-compose.staginglike.yml
PRISMA_SCHEMA := apps/api/src/prisma/schema.prisma
ENV_FILE ?= .env

.PHONY: help install prisma-generate prisma-migrate-dev prisma-migrate-deploy prisma-studio \
	dev-api dev-worker dev-dashboard dev-up dev-down dev-logs dev-ps \
	typecheck lint test check build-api build-worker build-dashboard build-all \
	health-api health-worker clean doctor seed-demo dev-up-staginglike dev-down-staginglike

help: ## Show available commands
	@echo "AI Content Pipeline - Useful Commands"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-24s %s\n", $$1, $$2}'

install: ## Install workspace dependencies
	npm install

prisma-generate: ## Generate Prisma client from schema
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	npx prisma generate --schema $(PRISMA_SCHEMA)

prisma-migrate-dev: ## Run Prisma dev migration (use: make prisma-migrate-dev NAME=your_migration)
	@if [ -z "$(NAME)" ]; then echo "Usage: make prisma-migrate-dev NAME=your_migration"; exit 0; fi
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	DB_HOST=$$(echo "$$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\\1#'); \
	DB_PORT=$$(echo "$$DATABASE_URL" | sed -nE 's#.*:([0-9]+)/.*#\\1#p'); \
	[ -z "$$DB_PORT" ] && DB_PORT=5432; \
	if ! (echo > /dev/tcp/$$DB_HOST/$$DB_PORT) >/dev/null 2>&1; then \
	  echo "Database $$DB_HOST:$$DB_PORT is not reachable; skipping prisma-migrate-dev."; \
	  exit 0; \
	fi; \
	npx prisma migrate dev --schema $(PRISMA_SCHEMA) --name $(NAME)

prisma-migrate-deploy: ## Apply Prisma migrations in deploy mode
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	DB_HOST=$$(echo "$$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\\1#'); \
	DB_PORT=$$(echo "$$DATABASE_URL" | sed -nE 's#.*:([0-9]+)/.*#\\1#p'); \
	[ -z "$$DB_PORT" ] && DB_PORT=5432; \
	if ! (echo > /dev/tcp/$$DB_HOST/$$DB_PORT) >/dev/null 2>&1; then \
	  echo "Database $$DB_HOST:$$DB_PORT is not reachable; skipping prisma-migrate-deploy."; \
	  exit 0; \
	fi; \
	npx prisma migrate deploy --schema $(PRISMA_SCHEMA)

prisma-studio: ## Open Prisma Studio
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	DB_HOST=$$(echo "$$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\\1#'); \
	DB_PORT=$$(echo "$$DATABASE_URL" | sed -nE 's#.*:([0-9]+)/.*#\\1#p'); \
	[ -z "$$DB_PORT" ] && DB_PORT=5432; \
	if ! (echo > /dev/tcp/$$DB_HOST/$$DB_PORT) >/dev/null 2>&1; then \
	  echo "Database $$DB_HOST:$$DB_PORT is not reachable; skipping prisma-studio."; \
	  exit 0; \
	fi; \
	npx prisma studio --schema $(PRISMA_SCHEMA)

dev-api: ## Run API in dev mode
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	DB_HOST=$$(echo "$$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\1#'); \
	DB_PORT=$$(echo "$$DATABASE_URL" | sed -nE 's#.*:([0-9]+)/.*#\1#p'); \
	[ -z "$$DB_PORT" ] && DB_PORT=5432; \
	REDIS_HOST=$$(echo "$$REDIS_URL" | sed -E 's#.*://([^:/]+).*#\1#'); \
	REDIS_PORT=$$(echo "$$REDIS_URL" | sed -nE 's#.*:([0-9]+).*#\1#p'); \
	[ -z "$$REDIS_PORT" ] && REDIS_PORT=6379; \
	if ! (echo > /dev/tcp/$$DB_HOST/$$DB_PORT) >/dev/null 2>&1; then \
	  echo "Database $$DB_HOST:$$DB_PORT is not reachable; skipping dev-api."; \
	  exit 0; \
	fi; \
	if ! (echo > /dev/tcp/$$REDIS_HOST/$$REDIS_PORT) >/dev/null 2>&1; then \
	  echo "Redis $$REDIS_HOST:$$REDIS_PORT is not reachable; skipping dev-api."; \
	  exit 0; \
	fi; \
	npm run dev:api

dev-worker: ## Run worker in dev mode
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	DB_HOST=$$(echo "$$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\1#'); \
	DB_PORT=$$(echo "$$DATABASE_URL" | sed -nE 's#.*:([0-9]+)/.*#\1#p'); \
	[ -z "$$DB_PORT" ] && DB_PORT=5432; \
	REDIS_HOST=$$(echo "$$REDIS_URL" | sed -E 's#.*://([^:/]+).*#\1#'); \
	REDIS_PORT=$$(echo "$$REDIS_URL" | sed -nE 's#.*:([0-9]+).*#\1#p'); \
	[ -z "$$REDIS_PORT" ] && REDIS_PORT=6379; \
	if ! (echo > /dev/tcp/$$DB_HOST/$$DB_PORT) >/dev/null 2>&1; then \
	  echo "Database $$DB_HOST:$$DB_PORT is not reachable; skipping dev-worker."; \
	  exit 0; \
	fi; \
	if ! (echo > /dev/tcp/$$REDIS_HOST/$$REDIS_PORT) >/dev/null 2>&1; then \
	  echo "Redis $$REDIS_HOST:$$REDIS_PORT is not reachable; skipping dev-worker."; \
	  exit 0; \
	fi; \
	npm run dev:worker

dev-dashboard: ## Run dashboard in dev mode
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	PORT=$${DASHBOARD_HOST_PORT:-3000} npm --workspace @aicp/dashboard run dev

dev-up: ## Start local infra/services with Docker Compose
	@if docker info >/dev/null 2>&1; then \
	  docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) --profile local up -d; \
	else \
	  echo "Docker daemon not available; skipping dev-up."; \
	fi

dev-down: ## Stop local infra/services
	@if docker info >/dev/null 2>&1; then \
	  docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) --profile local down; \
	else \
	  echo "Docker daemon not available; skipping dev-down."; \
	fi

dev-logs: ## Tail Docker Compose logs
	@if docker info >/dev/null 2>&1; then \
	  docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) --profile local logs -f --tail=200; \
	else \
	  echo "Docker daemon not available; skipping dev-logs."; \
	fi

dev-ps: ## Show Docker Compose services status
	@if docker info >/dev/null 2>&1; then \
	  docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) --profile local ps; \
	else \
	  echo "Docker daemon not available; skipping dev-ps."; \
	fi

dev-up-staginglike: ## Start staging-like local stack
	@if docker info >/dev/null 2>&1; then \
	  docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) -f $(STAGINGLIKE_COMPOSE_FILE) --profile local up -d; \
	else \
	  echo "Docker daemon not available; skipping dev-up-staginglike."; \
	fi

dev-down-staginglike: ## Stop staging-like local stack
	@if docker info >/dev/null 2>&1; then \
	  docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) -f $(STAGINGLIKE_COMPOSE_FILE) --profile local down; \
	else \
	  echo "Docker daemon not available; skipping dev-down-staginglike."; \
	fi

typecheck: ## Run TypeScript typecheck across workspaces
	npm run typecheck

lint: ## Run lint across workspaces
	npm run lint

test: ## Run tests across workspaces
	npm run test

check: ## Run full quality checks (typecheck + lint + test)
	$(MAKE) typecheck
	$(MAKE) lint
	$(MAKE) test

build-api: ## Build API workspace
	npm run build:api

build-worker: ## Build worker workspace
	npm run build:worker

build-dashboard: ## Build dashboard workspace
	npm run build:dashboard

build-all: ## Build API, worker, and dashboard
	$(MAKE) build-api
	$(MAKE) build-worker
	$(MAKE) build-dashboard

health-api: ## Check API health endpoint
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	curl -fsS http://localhost:$${API_HOST_PORT:-3001}/api/health || true

health-worker: ## Check worker health endpoint
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	curl -fsS http://localhost:$${WORKER_METRICS_HOST_PORT:-3002}/health || true

doctor: ## Check local toolchain and env readiness
	@echo "Node: $$(node -v 2>/dev/null || echo missing)"
	@echo "npm:  $$(npm -v 2>/dev/null || echo missing)"
	@echo "Docker: $$(docker --version 2>/dev/null || echo missing)"
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	echo "DATABASE_URL: $${DATABASE_URL:-missing}"; \
	echo "REDIS_URL: $${REDIS_URL:-missing}"; \
	echo "OTEL_ENABLED: $${OTEL_ENABLED:-missing}"; \
	echo "OTEL_EXPORTER_OTLP_ENDPOINT: $${OTEL_EXPORTER_OTLP_ENDPOINT:-$${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT:-missing}}"; \
	echo "OPENAI_API_KEY: $$([ -n "$${OPENAI_API_KEY}" ] && echo configured || echo missing)"; \
	echo "DEVTO_API_KEY: $$([ -n "$${DEVTO_API_KEY}" ] && echo configured || echo missing)"

seed-demo: ## Seed local demo topics into the configured database
	@set -a; \
	if [ -f "$(ENV_FILE)" ]; then source "$(ENV_FILE)"; else echo "Missing $(ENV_FILE). Create it from .env.example."; exit 0; fi; \
	set +a; \
	node scripts/seed-demo.mjs

clean: ## Remove build outputs
	find apps -type d -name dist -prune -exec rm -rf {} +
	find apps/dashboard -maxdepth 1 -type d \( -name .next -o -name .next-docker \) -prune -exec rm -rf {} +
	rm -rf apps/dashboard/tmp
