#!/bin/bash

# Simple script to set Novu credentials
# Usage: ./scripts/set-novu-credentials.sh <APP_ID> <SECRET_KEY>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <APPLICATION_IDENTIFIER> <SECRET_KEY>"
    echo ""
    echo "Primer:"
    echo "  $0 p6qmMf55BRZ1 sk_live_abc123..."
    exit 1
fi

APP_ID=$1
SECRET_KEY=$2

echo "Ažuriranje Novu credentials..."

# Update API .env
API_ENV="apps/api/.env"
if [ -f "$API_ENV" ]; then
    # Use sed with different syntax for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^NOVU_API_KEY=.*|NOVU_API_KEY=$SECRET_KEY|" "$API_ENV"
        sed -i '' "s|^NOVU_APP_ID=.*|NOVU_APP_ID=$APP_ID|" "$API_ENV"
    else
        sed -i "s|^NOVU_API_KEY=.*|NOVU_API_KEY=$SECRET_KEY|" "$API_ENV"
        sed -i "s|^NOVU_APP_ID=.*|NOVU_APP_ID=$APP_ID|" "$API_ENV"
    fi
    echo "✅ Ažuriran apps/api/.env"
else
    echo "❌ apps/api/.env ne postoji!"
    exit 1
fi

# Update Dashboard .env.local
DASHBOARD_ENV="apps/dashboard/.env.local"
if [ -f "$DASHBOARD_ENV" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^NEXT_PUBLIC_NOVU_APP_ID=.*|NEXT_PUBLIC_NOVU_APP_ID=$APP_ID|" "$DASHBOARD_ENV"
    else
        sed -i "s|^NEXT_PUBLIC_NOVU_APP_ID=.*|NEXT_PUBLIC_NOVU_APP_ID=$APP_ID|" "$DASHBOARD_ENV"
    fi
    echo "✅ Ažuriran apps/dashboard/.env.local"
else
    echo "❌ apps/dashboard/.env.local ne postoji!"
    exit 1
fi

echo ""
echo "=== Provera ==="
echo ""
echo "API .env:"
grep "NOVU" "$API_ENV"
echo ""
echo "Dashboard .env.local:"
grep "NOVU" "$DASHBOARD_ENV"
echo ""
echo "✅ Gotovo! Restart-ujte servere."

