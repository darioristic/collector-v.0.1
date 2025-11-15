#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-http://localhost:4000}
CHAT_URL=${CHAT_URL:-http://localhost:4001}

wait_for() {
  url=$1
  max=${2:-30}
  count=0
  until curl -sf "$url" >/dev/null; do
    count=$((count+1))
    if [ "$count" -ge "$max" ]; then
      exit 1
    fi
    sleep 1
  done
}

docker compose up -d

wait_for "$API_URL/api/health" 60
wait_for "$CHAT_URL/health" 60

email="e2e.user@collectorlabs.test"
password="Collector!2025"

curl -s -X POST "$API_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"companyName\":\"E2E Co\",\"fullName\":\"E2E User\",\"email\":\"$email\",\"password\":\"$password\"}" >/dev/null || true

token=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$token" ]; then
  echo "Login failed"
  exit 1
fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$CHAT_URL/api/conversations" \
  -H "Authorization: Bearer $token")

test "$code" = "200"