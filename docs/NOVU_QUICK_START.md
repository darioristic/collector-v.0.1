# Novu Quick Start Guide

## ✅ Completed Steps

1. ✅ Dependencies installed (`@novu/node@2.6.6`, `@novu/react@3.11.0`, `bullmq`)
2. ✅ Environment variables added to `.env` files (placeholders added)
3. ✅ Database migration completed (`user_notification_preferences` table created)

## 🔧 Next Steps (Manual)

### Step 1: Create Novu Account and Get Credentials

1. Go to [https://web.novu.co](https://web.novu.co)
2. Sign up for a free account (or log in if you already have one)
3. Create a new application or select an existing one
4. Go to **Settings** → **API Keys**
5. Copy your **API Key** (this is your `NOVU_API_KEY`)
6. Copy your **Application Identifier** (this is your `NOVU_APP_ID`)

### Step 2: Update Environment Variables

**Update `apps/api/.env`:**
```bash
# Replace the placeholder values:
NOVU_API_KEY=your_actual_api_key_from_novu_dashboard
NOVU_APP_ID=your_actual_app_id_from_novu_dashboard
```

**Update `apps/dashboard/.env.local`:**
```bash
# Replace the placeholder value:
NEXT_PUBLIC_NOVU_APP_ID=your_actual_app_id_from_novu_dashboard
```

### Step 3: Configure Resend Integration

1. Go to [Resend Dashboard](https://resend.com/api-keys) and get your API key
2. In Novu Dashboard, go to **Integrations** → **Add Integration**
3. Select **Resend**
4. Enter your Resend API Key
5. Configure the "From" email address (must be verified in Resend)
6. Save the integration

### Step 4: Create Notification Workflows

Create these workflows in Novu Dashboard (Workflows → Create Workflow):

#### 4.1 Invoice Sent (`invoice-sent`)

**Steps:**
1. **Email Step** (Resend):
   - Subject: `Invoice {{invoiceNumber}}`
   - Body (HTML):
     ```html
     <h2>Invoice {{invoiceNumber}}</h2>
     <p>{{message}}</p>
     <p><a href="{{link}}">View Invoice</a></p>
     ```
2. **In-App Step**:
   - Title: `{{title}}`
   - Body: `{{message}}`
   - CTA: `{{cta}}` (if provided)

#### 4.2 Payment Received (`payment-received`)

**Steps:**
1. **Email Step** (Resend):
   - Subject: `Payment Received - {{amount}} {{currency}}`
   - Body: `{{message}}`
2. **In-App Step**:
   - Title: `{{title}}`
   - Body: `{{message}}`

#### 4.3 Transaction Created (`transaction-created`)

**Steps:**
1. **In-App Step** (primary):
   - Title: `{{title}}`
   - Body: `{{message}}`
2. **Email Step** (fallback - optional):
   - Subject: `New Transaction`
   - Body: `{{message}}`

#### 4.4 Daily Summary (`daily-summary`)

**Steps:**
1. **Email Step** only (Resend):
   - Subject: `Daily Summary - {{date}}`
   - Body: `{{message}}`

**Important:** Workflow IDs must match exactly (case-sensitive):
- `invoice-sent`
- `payment-received`
- `transaction-created`
- `daily-summary`

### Step 5: Test the System

1. **Start the API server:**
   ```bash
   cd apps/api
   bun run dev
   ```
   Look for: `✅ Novu notification system initialized`

2. **Start the dashboard:**
   ```bash
   cd apps/dashboard
   bun run dev
   ```

3. **Test notifications:**
   - Create an invoice and send it (should trigger `invoice.sent` event)
   - Create a payment (should trigger `payment.received` event)
   - Check Novu dashboard for sent notifications
   - Check email inbox for email notifications
   - Check in-app notifications in the dashboard

4. **Test user preferences:**
   - Go to Settings → Notifications
   - Toggle email/in-app preferences
   - Verify notifications respect preferences

## 🔍 Troubleshooting

### "Novu API Key is not set"
- Ensure `NOVU_API_KEY` is set in `apps/api/.env`
- Restart the API server after updating `.env`

### "Workflow not found"
- Verify workflow IDs match exactly (case-sensitive)
- Ensure workflows are published in Novu dashboard
- Check workflow names: `invoice-sent`, `payment-received`, etc.

### "Resend integration failed"
- Verify Resend API key is correct
- Ensure "From" email is verified in Resend
- Check Resend integration is active in Novu dashboard

### "Redis connection failed"
- Ensure Redis is running: `redis-cli ping`
- Verify `REDIS_URL` in `apps/api/.env`
- Check Redis logs for connection issues

### Notifications not appearing
- Check Novu dashboard → Activity Feed for sent notifications
- Verify subscriber ID (user ID) matches
- Check browser console for Novu SDK errors
- Ensure `NEXT_PUBLIC_NOVU_APP_ID` is set in dashboard `.env.local`

## 📝 Verification Checklist

- [ ] Novu account created
- [ ] API Key and App ID obtained
- [ ] Environment variables updated with real values
- [ ] Resend integration configured
- [ ] All 4 workflows created in Novu dashboard
- [ ] API server starts without errors
- [ ] Dashboard starts without errors
- [ ] Test invoice creation triggers notification
- [ ] Test payment creation triggers notification
- [ ] Email notifications received
- [ ] In-app notifications appear
- [ ] User preferences page works

## 🚀 Quick Test Commands

```bash
# Check if Redis is running
redis-cli ping

# Check if database migration was applied
psql $DATABASE_URL -c "SELECT * FROM user_notification_preferences LIMIT 1;"

# Check API server logs for Novu initialization
cd apps/api && bun run dev | grep -i novu

# Check dashboard for Novu provider
cd apps/dashboard && bun run dev
# Then check browser console for Novu SDK messages
```

## 📚 Additional Resources

- [Novu Documentation](https://docs.novu.co)
- [Novu React SDK](https://docs.novu.co/sdks/react)
- [Resend Documentation](https://resend.com/docs)
- Full setup guide: `docs/NOVU_SETUP.md`

