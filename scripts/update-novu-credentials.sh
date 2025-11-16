#!/bin/bash

# Script to update Novu credentials in .env files

echo "=== Novu Credentials Setup ==="
echo ""
echo "Unesite vrednosti sa Novu dashboard-a:"
echo ""

# Get Application Identifier
read -p "Application Identifier (iz 'Application Identifier' polja): " APP_ID

# Get Secret Key
read -p "Secret Key (iz 'Secret Key' polja, kliknite eye ikonu da otkrijete): " SECRET_KEY

if [ -z "$APP_ID" ] || [ -z "$SECRET_KEY" ]; then
    echo "❌ Greška: Obe vrednosti su obavezne!"
    exit 1
fi

# Update API .env
API_ENV="apps/api/.env"
if [ -f "$API_ENV" ]; then
    # Replace or add NOVU_API_KEY
    if grep -q "^NOVU_API_KEY=" "$API_ENV"; then
        sed -i.bak "s|^NOVU_API_KEY=.*|NOVU_API_KEY=$SECRET_KEY|" "$API_ENV"
    else
        echo "NOVU_API_KEY=$SECRET_KEY" >> "$API_ENV"
    fi
    
    # Replace or add NOVU_APP_ID
    if grep -q "^NOVU_APP_ID=" "$API_ENV"; then
        sed -i.bak "s|^NOVU_APP_ID=.*|NOVU_APP_ID=$APP_ID|" "$API_ENV"
    else
        echo "NOVU_APP_ID=$APP_ID" >> "$API_ENV"
    fi
    
    echo "✅ Ažuriran apps/api/.env"
else
    echo "❌ Fajl $API_ENV ne postoji!"
fi

# Update Dashboard .env.local
DASHBOARD_ENV="apps/dashboard/.env.local"
if [ -f "$DASHBOARD_ENV" ]; then
    # Replace or add NEXT_PUBLIC_NOVU_APP_ID
    if grep -q "^NEXT_PUBLIC_NOVU_APP_ID=" "$DASHBOARD_ENV"; then
        sed -i.bak "s|^NEXT_PUBLIC_NOVU_APP_ID=.*|NEXT_PUBLIC_NOVU_APP_ID=$APP_ID|" "$DASHBOARD_ENV"
    else
        echo "NEXT_PUBLIC_NOVU_APP_ID=$APP_ID" >> "$DASHBOARD_ENV"
    fi
    
    echo "✅ Ažuriran apps/dashboard/.env.local"
else
    echo "❌ Fajl $DASHBOARD_ENV ne postoji!"
fi

echo ""
echo "=== Provera ==="
echo ""
echo "API .env:"
grep "NOVU" "$API_ENV" 2>/dev/null || echo "  (nije pronađeno)"
echo ""
echo "Dashboard .env.local:"
grep "NOVU" "$DASHBOARD_ENV" 2>/dev/null || echo "  (nije pronađeno)"
echo ""
echo "✅ Gotovo! Restart-ujte servere da primene promene."

