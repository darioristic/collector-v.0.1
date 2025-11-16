# Novu Notification System Setup Guide

## 1. Environment Variables

### Backend (apps/api/.env)

```env
# Novu Configuration
NOVU_API_KEY=your_novu_api_key_here
NOVU_APP_ID=your_novu_app_id_here

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379
```

### Frontend (apps/dashboard/.env.local)

```env
# Novu Configuration (Frontend)
NEXT_PUBLIC_NOVU_APP_ID=your_novu_app_id_here
```

## 2. Getting Novu Credentials

1. Sign up or log in to [Novu Dashboard](https://web.novu.co)
2. Create a new application or select an existing one
3. Go to **Settings** → **API Keys**
4. Copy your **API Key** (this is your `NOVU_API_KEY`)
5. Copy your **Application Identifier** (this is your `NOVU_APP_ID`)

## 3. Configuring Resend Integration

1. Go to [Novu Dashboard](https://web.novu.co) → **Integrations**
2. Click **Add Integration**
3. Select **Resend** from the list
4. Enter your Resend API Key (get it from [Resend Dashboard](https://resend.com/api-keys))
5. Configure the "From" email address
6. Save the integration

## 4. Creating Notification Workflows

You need to create the following workflows in Novu Dashboard:

### 4.1 Invoice Sent Workflow

1. Go to **Workflows** → **Create Workflow**
2. Name: `invoice-sent`
3. Add steps:
   - **Email** step:
     - Use Resend integration
     - Subject: `Invoice {{invoiceNumber}}`
     - Body: Use template variables like `{{title}}`, `{{message}}`, `{{link}}`
   - **In-App** step:
     - Title: `{{title}}`
     - Body: `{{message}}`
     - CTA: `{{cta}}` (if provided)
4. Save workflow

### 4.2 Payment Received Workflow

1. Create workflow named: `payment-received`
2. Add steps:
   - **Email** step (Resend):
     - Subject: `Payment Received - {{amount}} {{currency}}`
     - Body: Include payment details
   - **In-App** step:
     - Title: `Payment Received`
     - Body: `{{message}}`
3. Save workflow

### 4.3 Transaction Created Workflow

1. Create workflow named: `transaction-created`
2. Add steps:
   - **In-App** step (primary):
     - Title: `New {{type}} Transaction`
     - Body: `{{message}}`
   - **Email** step (fallback - optional):
     - Subject: `New Transaction`
     - Body: `{{message}}`
3. Save workflow

### 4.4 Daily Summary Workflow

1. Create workflow named: `daily-summary`
2. Add steps:
   - **Email** step only (Resend):
     - Subject: `Daily Summary - {{date}}`
     - Body: Include summary details from `{{summary}}`
3. Save workflow

### 4.5 Additional Workflows (Optional)

You can also create workflows for:
- `quote-approved` - When quotes are approved
- `deal-won` - When deals are won
- `project-milestone` - When project milestones are reached
- `task-assigned` - When tasks are assigned
- `system-alert` - For system alerts

## 5. Workflow Template Variables

The following variables are available in your workflows:

- `{{title}}` - Notification title
- `{{message}}` - Notification message
- `{{link}}` - Optional link URL
- `{{userId}}` - User ID
- `{{companyId}}` - Company ID
- `{{invoiceNumber}}` - Invoice number (for invoice events)
- `{{amount}}` - Amount (for payment/transaction events)
- `{{currency}}` - Currency code
- `{{customerName}}` - Customer name
- `{{date}}` - Date (for daily summary)
- `{{summary}}` - Summary object (for daily summary)

## 6. Testing Workflows

1. After creating workflows, test them using Novu's test feature
2. Use the subscriber ID (user ID) to test notifications
3. Verify that emails are sent via Resend
4. Verify that in-app notifications appear correctly

## 7. Database Migration

The database migration has been generated. Run it with:

```bash
cd apps/api
bun run db:migrate
```

This will create the `user_notification_preferences` table.

## 8. Verifying Setup

1. Start the API server: `cd apps/api && bun run dev`
2. Start the dashboard: `cd apps/dashboard && bun run dev`
3. Check server logs for "Novu notification system initialized"
4. Test sending a notification by creating an invoice or payment
5. Verify notifications appear in the dashboard

## Troubleshooting

### Novu API Key Issues
- Ensure `NOVU_API_KEY` is set correctly
- Check that the API key has the right permissions
- Verify the application ID matches your Novu app

### Resend Integration Issues
- Verify Resend API key is correct
- Check that "From" email is verified in Resend
- Ensure Resend integration is active in Novu dashboard

### Redis Connection Issues
- Verify `REDIS_URL` is correct
- Ensure Redis server is running
- Check Redis connection in logs

### Workflow Not Found Errors
- Ensure workflow IDs match exactly (case-sensitive)
- Verify workflows are published in Novu dashboard
- Check workflow names match: `invoice-sent`, `payment-received`, etc.

## Next Steps

1. ✅ Install dependencies: `bun install` (completed)
2. ✅ Set environment variables (see above)
3. ✅ Run database migrations: `bun run db:migrate` (completed)
4. ⏳ Create workflows in Novu dashboard (manual step)
5. ⏳ Configure Resend integration in Novu dashboard (manual step)
6. ⏳ Test the notification system

