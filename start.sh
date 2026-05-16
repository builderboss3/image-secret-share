#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  pnpm --filter @workspace/db run push 2>&1 || {
    echo "Warning: DB push failed, continuing anyway"
  }
else
  echo "No DATABASE_URL set — skipping migrations"
fi

echo "Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
