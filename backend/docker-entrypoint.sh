#!/bin/sh
set -eu

if [ -z "${DIRECT_URL:-}" ]; then
  export DIRECT_URL="${DATABASE_URL:-}"
fi

i=0
until npx tsx src/db/migrate-deploy.ts; do
  i=$((i + 1))
  if [ "$i" -gt 15 ]; then
    exit 1
  fi
  echo retry migrate
  sleep 2
done

if [ "${SEED_ON_BOOT:-}" = "1" ]; then
  npx tsx prisma/seed.ts
fi

exec npx tsx src/index.ts
