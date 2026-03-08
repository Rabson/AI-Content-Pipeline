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
  if [ -d node_modules ] && [ "$(find node_modules -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1 | wc -l | tr -d ' ')" != "0" ]; then
    npm install --prefer-offline --no-audit
  else
    npm ci --no-audit
  fi

  ./node_modules/.bin/prisma generate
  mkdir -p node_modules
  printf '%s' "$LOCK_HASH" > node_modules/.package-lock.hash
fi

exec npm run "$1"
