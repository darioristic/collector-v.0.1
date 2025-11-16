# Novu Workflows Setup - Detaljna Uputstva

## ✅ Completed

- ✅ Credentials postavljeni:
  - Application Identifier: `p6qmMf55BRZ1`
  - Secret Key: `a040cb08b7363b79662d03e58ca0a8b8`
- ✅ Database migracija: `user_notification_preferences` tabela kreirana

## 🔧 Step 1: Configure Resend Integration

1. **Get Resend API Key:**
   - Go to [https://resend.com/api-keys](https://resend.com/api-keys)
   - Create a new API key or use existing one
   - Copy the API key

2. **Add Resend to Novu:**
   - Go to [https://web.novu.co](https://web.novu.co)
   - Navigate to **Integrations** (left sidebar)
   - Click **Add Integration**
   - Select **Resend** from the list
   - Paste your Resend API Key
   - Configure **"From" email address** (must be verified in Resend)
   - Click **Save**

## 🔧 Step 2: Create Workflows

Go to **Workflows** → **Create Workflow** in Novu dashboard.

### Workflow 1: Invoice Sent (`invoice-sent`)

**Workflow ID must be exactly:** `invoice-sent`

**Steps:**

1. **Email Step:**
   - Channel: **Email**
   - Integration: **Resend**
   - Subject: `Invoice {{invoiceNumber}}`
   - Body (HTML):
     ```html
     <h2>Invoice {{invoiceNumber}}</h2>
     <p>{{message}}</p>
     <p><a href="{{link}}">View Invoice</a></p>
     {{#if customerName}}
     <p>Customer: {{customerName}}</p>
     {{/if}}
     {{#if amount}}
     <p>Amount: {{amount}} {{currency}}</p>
     {{/if}}
     ```

2. **In-App Step:**
   - Channel: **In-App**
   - Title: `{{title}}`
   - Body: `{{message}}`
   - CTA (if provided): `{{cta}}`

**Variables available:**
- `{{title}}` - Notification title
- `{{message}}` - Notification message
- `{{link}}` - Invoice link URL
- `{{invoiceNumber}}` - Invoice number
- `{{customerName}}` - Customer name (optional)
- `{{amount}}` - Invoice amount (optional)
- `{{currency}}` - Currency code (optional)

### Workflow 2: Payment Received (`payment-received`)

**Workflow ID must be exactly:** `payment-received`

**Steps:**

1. **Email Step:**
   - Channel: **Email**
   - Integration: **Resend**
   - Subject: `Payment Received - {{amount}} {{currency}}`
   - Body (HTML):
     ```html
     <h2>Payment Received</h2>
     <p>A payment of <strong>{{amount}} {{currency}}</strong> has been received.</p>
     {{#if customerName}}
     <p>Customer: {{customerName}}</p>
     {{/if}}
     {{#if invoiceId}}
     <p><a href="/invoices/{{invoiceId}}">View Invoice</a></p>
     {{/if}}
     ```

2. **In-App Step:**
   - Channel: **In-App**
   - Title: `{{title}}`
   - Body: `{{message}}`
   - CTA: `{{cta}}` (if provided)

**Variables available:**
- `{{title}}` - "Payment Received"
- `{{message}}` - Payment details message
- `{{amount}}` - Payment amount
- `{{currency}}` - Currency code
- `{{customerName}}` - Customer name (optional)
- `{{invoiceId}}` - Related invoice ID (optional)

### Workflow 3: Transaction Created (`transaction-created`)

**Workflow ID must be exactly:** `transaction-created`

**Steps:**

1. **In-App Step (Primary):**
   - Channel: **In-App**
   - Title: `{{title}}`
   - Body: `{{message}}`
   - CTA: `{{cta}}` (if provided)

2. **Email Step (Fallback - Optional):**
   - Channel: **Email**
   - Integration: **Resend**
   - Subject: `New {{type}} Transaction`
   - Body: `{{message}}`

**Variables available:**
- `{{title}}` - Transaction title
- `{{message}}` - Transaction message
- `{{type}}` - "income" or "expense"
- `{{amount}}` - Transaction amount
- `{{currency}}` - Currency code
- `{{description}}` - Transaction description (optional)

### Workflow 4: Daily Summary (`daily-summary`)

**Workflow ID must be exactly:** `daily-summary`

**Steps:**

1. **Email Step (Only):**
   - Channel: **Email**
   - Integration: **Resend**
   - Subject: `Daily Summary - {{date}}`
   - Body (HTML):
     ```html
     <h2>Daily Summary - {{date}}</h2>
     <ul>
       {{#if summary.invoicesCount}}
       <li>Invoices: {{summary.invoicesCount}}</li>
       {{/if}}
       {{#if summary.paymentsCount}}
       <li>Payments: {{summary.paymentsCount}}</li>
       {{/if}}
       {{#if summary.transactionsCount}}
       <li>Transactions: {{summary.transactionsCount}}</li>
       {{/if}}
       {{#if summary.totalRevenue}}
       <li>Total Revenue: {{summary.totalRevenue}} {{summary.currency}}</li>
       {{/if}}
     </ul>
     <p><a href="/dashboard?date={{date}}">View Dashboard</a></p>
     ```

**Variables available:**
- `{{date}}` - Date in ISO format
- `{{summary}}` - Summary object with counts and revenue

## ⚠️ Important Notes

1. **Workflow IDs are case-sensitive!** They must match exactly:
   - `invoice-sent` (not `Invoice-Sent` or `invoice_sent`)
   - `payment-received`
   - `transaction-created`
   - `daily-summary`

2. **Publish workflows** after creating them (click "Publish" button)

3. **Test workflows** using Novu's test feature before going live

4. **Variables** - Use Handlebars syntax `{{variableName}}` in templates

## 🧪 Testing Workflows

1. In Novu dashboard, go to **Workflows**
2. Click on a workflow
3. Click **"Test"** button
4. Enter test subscriber ID (use a user ID from your database)
5. Send test notification
6. Verify it appears in:
   - Email inbox (if email step included)
   - In-app notifications (if in-app step included)

## ✅ Verification Checklist

- [ ] Resend integration added and active
- [ ] `invoice-sent` workflow created and published
- [ ] `payment-received` workflow created and published
- [ ] `transaction-created` workflow created and published
- [ ] `daily-summary` workflow created and published
- [ ] All workflows tested successfully
- [ ] Workflow IDs match exactly (case-sensitive)

## 🚀 Next: Test the System

After workflows are created:

1. Start API server: `cd apps/api && bun run dev`
2. Start Dashboard: `cd apps/dashboard && bun run dev`
3. Create an invoice or payment to trigger notifications
4. Check Novu dashboard → Activity Feed for sent notifications
5. Verify emails are received
6. Verify in-app notifications appear

