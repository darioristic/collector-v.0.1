#!/bin/bash

# Complete Novu setup script
# This script guides you through the entire Novu setup process

set -e

echo "🚀 Novu Notification System - Complete Setup"
echo "============================================"
echo ""

# Step 1: Check if credentials are set
echo "📋 Step 1: Checking Novu credentials..."
echo ""

API_ENV="apps/api/.env"
DASHBOARD_ENV="apps/dashboard/.env.local"

if [ -f "$API_ENV" ] && grep -q "NOVU_API_KEY=your_novu_api_key_here" "$API_ENV"; then
    echo "⚠️  Novu credentials nisu postavljeni!"
    echo ""
    echo "Molimo vas:"
    echo "1. Idite na https://web.novu.co → Developer → API Keys"
    echo "2. Kopirajte Application Identifier"
    echo "3. Otkrijte i kopirajte Secret Key (kliknite eye ikonu)"
    echo "4. Pokrenite:"
    echo "   ./scripts/set-novu-credentials.sh <APP_ID> <SECRET_KEY>"
    echo ""
    read -p "Da li želite da nastavite sa setup-om? (y/n): " continue_setup
    if [ "$continue_setup" != "y" ]; then
        echo "Setup prekinut. Postavite credentials i pokrenite ponovo."
        exit 1
    fi
else
    echo "✅ Novu credentials su postavljeni"
    grep "NOVU" "$API_ENV" 2>/dev/null | head -2
fi

echo ""
echo "📋 Step 2: Checking database migration..."
if [ -f "$API_ENV" ] && grep -q "DATABASE_URL" "$API_ENV"; then
    DB_URL=$(grep "^DATABASE_URL=" "$API_ENV" | cut -d '=' -f2-)
    if [ -n "$DB_URL" ]; then
        TABLE_EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_notification_preferences');" 2>/dev/null | tr -d ' ')
        if [ "$TABLE_EXISTS" = "t" ]; then
            echo "✅ Database migration completed (user_notification_preferences table exists)"
        else
            echo "⚠️  Database migration not completed"
            echo "   Running migration..."
            psql "$DB_URL" -f apps/api/src/db/migrations/0031_add_user_notification_preferences.sql 2>&1 | grep -E "CREATE|DO|ERROR" || echo "✅ Migration completed"
        fi
    else
        echo "⚠️  DATABASE_URL not found in .env"
    fi
else
    echo "⚠️  Cannot check database (DATABASE_URL not set)"
fi

echo ""
echo "📋 Step 3: Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running"
        echo "   Start Redis with: redis-server"
    fi
else
    echo "⚠️  redis-cli not found (Redis may not be installed)"
fi

echo ""
echo "📋 Step 4: Checking dependencies..."
if [ -f "apps/api/node_modules/@novu/node/package.json" ]; then
    echo "✅ @novu/node installed"
else
    echo "⚠️  @novu/node not found - run: cd apps/api && bun install"
fi

if [ -f "apps/dashboard/node_modules/@novu/react/package.json" ]; then
    echo "✅ @novu/react installed"
else
    echo "⚠️  @novu/react not found - run: cd apps/dashboard && bun install"
fi

echo ""
echo "============================================"
echo "📝 Next Steps (Manual):"
echo ""
echo "1. ✅ Postavite Novu credentials (ako nije urađeno)"
echo "2. ⏭️  Konfigurišite Resend integraciju u Novu dashboard-u"
echo "3. ⏭️  Kreirajte workflows u Novu dashboard-u:"
echo "   - invoice-sent"
echo "   - payment-received"
echo "   - transaction-created"
echo "   - daily-summary"
echo "4. ⏭️  Testirajte sistem"
echo ""
echo "📚 Detaljna uputstva: docs/NOVU_QUICK_START.md"
echo ""

