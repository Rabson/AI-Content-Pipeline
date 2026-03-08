#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: scripts/docker-dev-bootstrap.sh <npm-script>" >&2
  exit 1
fi

LOCK_HASH="$(sha256sum package-lock.json | awk '{print $1}')"
CURRENT_HASH="$(cat node_modules/.package-lock.hash 2>/dev/null || true)"
PRISMA_READY=1

node -e "const client=require('@prisma/client'); if (!client.TopicStatus) process.exit(1)" >/dev/null 2>&1 || PRISMA_READY=0

if [ "$LOCK_HASH" != "$CURRENT_HASH" ] || [ "$PRISMA_READY" -ne 1 ]; then
  npm ci
  npx prisma generate --schema apps/api/src/prisma/schema.prisma
  mkdir -p node_modules
  printf '%s' "$LOCK_HASH" > node_modules/.package-lock.hash
fi

exec npm run "$1"
