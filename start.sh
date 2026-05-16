#!/bin/sh
set -e
echo "Running database migrations..."
pnpm --filter @workspace/db run push 2>&1 || {
  echo "Warning: DB push failed, continuing anyway (may already be up to date)"
}
echo "Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
