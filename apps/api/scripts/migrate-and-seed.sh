#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# Ako skriptu pokrećemo iz apps/api, APP_ROOT će biti već apps/api.
# Ako je pokrenemo iz root-a preko bun run --filter, doći ćemo do apps/api/scripts.
# U oba slučaja, APP_ROOT treba da pokazuje na apps/api.

info() {
  printf "\033[1;34m[INFO]\033[0m %s\n" "$*"
}

error() {
  printf "\033[1;31m[ERROR]\033[0m %s\n" "$*" >&2
}

cd "${APP_ROOT}"

info "Pokrećem migracije..."
if ! bun run db:migrate; then
  error "Migracije nisu uspele."
  exit 1
fi

info "Migracije uspešne. Pokrećem seed..."
if ! bun run db:seed; then
  error "Seed nije uspeo."
  exit 1
fi

info "Migracije i seed su uspešno završeni."

