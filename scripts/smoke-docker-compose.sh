#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_BASE_FILE="${COMPOSE_BASE_FILE:-infra/docker/compose.base.yml}"
COMPOSE_LOCAL_FILE="${COMPOSE_LOCAL_FILE:-infra/docker/compose.local.yml}"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_BASE_FILE" -f "$COMPOSE_LOCAL_FILE" ps

wait_for_status() {
  local service="$1"
  local url="$2"
  local expected="$3"
  local label="$4"

  for attempt in {1..15}; do
    if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_BASE_FILE" -f "$COMPOSE_LOCAL_FILE" exec -T "$service" \
      node -e "fetch('$url').then(r=>{console.log(JSON.stringify({label:'$label',status:r.status,attempt:$attempt}));process.exit(r.status===$expected?0:1)}).catch(err=>{console.error(err.message);process.exit(1)})"
    then
      return 0
    fi
    sleep 2
  done

  echo "Smoke check failed for $label ($url)"
  return 1
}

wait_for_status api "http://localhost:3001/api/health" 200 "api-health"
wait_for_status api "http://localhost:3001/api/ready" 200 "api-ready"
wait_for_status worker "http://localhost:3002/health" 200 "worker-health"
wait_for_status worker "http://localhost:3002/ready" 200 "worker-ready"
wait_for_status dashboard "http://localhost:3003/signin" 200 "dashboard-signin"
