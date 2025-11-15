#!/usr/bin/env bash
set -euo pipefail

DB_URL_DEFAULT="postgres://collector:collector@localhost:5432/collector"
DATABASE_URL="${DATABASE_URL:-$DB_URL_DEFAULT}"

psql "${DATABASE_URL%collector/*}postgres" -c "CREATE ROLE IF NOT EXISTS collector WITH LOGIN PASSWORD 'collector'; ALTER ROLE collector CREATEDB;" || true
createdb -U collector -h localhost collector || true

export DATABASE_URL
bun run --filter ./apps/api db:migrate
bun run --filter ./apps/api db:seed