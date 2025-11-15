#!/usr/bin/env bash
set -euo pipefail

# Config
API_URL=${API_URL:-http://localhost:4000}
CHAT_URL=${CHAT_URL:-http://localhost:4001}
DB_URL=${DB_URL:-postgres://collector:collector@localhost:5432/collector}

echo "[chat-bootstrap] Database: $DB_URL"

# Skip direct DB schema bootstrap when running with limited permissions

# Helper to login and return token
login() {
  local email="$1"; local password="$2";
  curl -s -X POST "$API_URL/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" | jq -r '.data.session.token'
}

# Helper to register a user (if not exists)
register() {
  local email="$1"; local password="$2"; local fullName="$3"; local companyName="Collector Labs";
  curl -s -X POST "$API_URL/api/auth/register" -H 'Content-Type: application/json' \
    -d "{\"companyName\":\"$companyName\",\"fullName\":\"$fullName\",\"email\":\"$email\",\"password\":\"$password\"}"
}


PASSWORD='Collector!2025'
TOKEN_DARIO=$(login 'dario@collectorlabs.test' "$PASSWORD")
if [ -z "$TOKEN_DARIO" ] || [ "$TOKEN_DARIO" = "null" ]; then
  echo "[chat-bootstrap] Registering Dario..."
  register 'dario@collectorlabs.test' "$PASSWORD" 'Dario Ristic' >/dev/null || true
  TOKEN_DARIO=$(login 'dario@collectorlabs.test' "$PASSWORD")
fi

TOKEN_MIHA=$(login 'miha@collectorlabs.test' "$PASSWORD")
if [ -z "$TOKEN_MIHA" ] || [ "$TOKEN_MIHA" = "null" ]; then
  echo "[chat-bootstrap] Registering Miha..."
  register 'miha@collectorlabs.test' "$PASSWORD" 'Miha' >/dev/null || true
  TOKEN_MIHA=$(login 'miha@collectorlabs.test' "$PASSWORD")
fi

TOKEN_TARA=$(login 'tara@collectorlabs.test' "$PASSWORD")
if [ -z "$TOKEN_TARA" ] || [ "$TOKEN_TARA" = "null" ]; then
  echo "[chat-bootstrap] Registering Tara..."
  register 'tara@collectorlabs.test' "$PASSWORD" 'Tara' >/dev/null || true
  TOKEN_TARA=$(login 'tara@collectorlabs.test' "$PASSWORD")
fi

# Ensure teamchat bootstrap for each user (creates teamchat_users/general channel via service)
echo "[chat-bootstrap] Bootstrapping teamchat via service..."
if [ -n "$TOKEN_DARIO" ] && [ "$TOKEN_DARIO" != "null" ]; then
  curl -s -X GET "$CHAT_URL/api/teamchat/bootstrap" -H "Authorization: Bearer $TOKEN_DARIO" >/dev/null || true
fi
if [ -n "$TOKEN_MIHA" ] && [ "$TOKEN_MIHA" != "null" ]; then
  curl -s -X GET "$CHAT_URL/api/teamchat/bootstrap" -H "Authorization: Bearer $TOKEN_MIHA" >/dev/null || true
fi
if [ -n "$TOKEN_TARA" ] && [ "$TOKEN_TARA" != "null" ]; then
  curl -s -X GET "$CHAT_URL/api/teamchat/bootstrap" -H "Authorization: Bearer $TOKEN_TARA" >/dev/null || true
fi


echo "[chat-bootstrap] Creating conversations..."

# Dario ↔ Miha
CONV_DM=$(curl -s -X POST "$CHAT_URL/api/conversations" -H "Authorization: Bearer $TOKEN_DARIO" \
  -H 'Content-Type: application/json' -d '{"targetEmail":"miha@collectorlabs.test"}' | jq -r '.conversation.id')

# Dario ↔ Tara
CONV_DT=$(curl -s -X POST "$CHAT_URL/api/conversations" -H "Authorization: Bearer $TOKEN_DARIO" \
  -H 'Content-Type: application/json' -d '{"targetEmail":"tara@collectorlabs.test"}' | jq -r '.conversation.id')

# Miha ↔ Tara
CONV_MT=$(curl -s -X POST "$CHAT_URL/api/conversations" -H "Authorization: Bearer $TOKEN_MIHA" \
  -H 'Content-Type: application/json' -d '{"targetEmail":"tara@collectorlabs.test"}' | jq -r '.conversation.id')

echo "[chat-bootstrap] Seed messages..."
curl -s -X POST "$CHAT_URL/api/conversations/$CONV_DM/messages" -H "Authorization: Bearer $TOKEN_DARIO" -H 'Content-Type: application/json' -d '{"content":"Hej Miha!"}' >/dev/null || true
curl -s -X POST "$CHAT_URL/api/conversations/$CONV_DM/messages" -H "Authorization: Bearer $TOKEN_MIHA" -H 'Content-Type: application/json' -d '{"content":"Ćao Dario!"}' >/dev/null || true

curl -s -X POST "$CHAT_URL/api/conversations/$CONV_DT/messages" -H "Authorization: Bearer $TOKEN_DARIO" -H 'Content-Type: application/json' -d '{"content":"Hej Tara!"}' >/dev/null || true
curl -s -X POST "$CHAT_URL/api/conversations/$CONV_DT/messages" -H "Authorization: Bearer $TOKEN_TARA" -H 'Content-Type: application/json' -d '{"content":"Ćao Dario!"}' >/dev/null || true

curl -s -X POST "$CHAT_URL/api/conversations/$CONV_MT/messages" -H "Authorization: Bearer $TOKEN_MIHA" -H 'Content-Type: application/json' -d '{"content":"Ćao Tara!"}' >/dev/null || true
curl -s -X POST "$CHAT_URL/api/conversations/$CONV_MT/messages" -H "Authorization: Bearer $TOKEN_TARA" -H 'Content-Type: application/json' -d '{"content":"Pozdrav Miha!"}' >/dev/null || true

echo "[chat-bootstrap] Done"