Create a full-featured CRM Dashboard Overview page in Next.js 15 + TypeScript using Tailwind CSS and Shadcn UI components.

Goal:
Recreate the modern CRM dashboard design from the reference image — with a sidebar, top search bar, metrics, analytics charts, and customer interactions table.

---

🧱 Tech stack:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI components
- Lucide-react icons
- Recharts for data visualization
- React Hook Form (for filters)
- Date picker for reporting period
- useToast for notifications

---

📁 File:
`app/crm/page.tsx`

---

🎨 Layout structure:

1. **Sidebar Navigation (left)**

   - Fixed vertical menu with section groups:
     - CRM
       - Overview (active)
       - Leads
       - Opportunities
       - Contacts
       - Accounts
       - Deals
       - Pipelines
     - Communications
       - Emails
       - Calls
       - Meetings
     - Analytics
       - Sales Reports
       - Performance
       - Activity
     - Customization
       - Themes
       - Layouts
   - Active link highlighted with accent border and background.
   - Footer section: user avatar with small menu.

2. **Top Bar**

   - Global search input (“Search…”)
   - Date range selector (e.g. “Daily”, “Weekly”, “Monthly”)
   - Date picker on the right (default: current date)
   - Export button (icon + label)

3. **Main Dashboard Content**
   - Page title: “Overview”
   - Two main analytics cards in a 2-column grid:

---

📊 **Card 1 — Projected Sales Growth**

- Metric summary:
  - Leads Generated: 1,284 Leads (+6.4% from last week)
  - Conversion Rate (Today): 18.7% (Compared to 16.2% yesterday)
- Mini line chart below (orange line with subtle grid background)
- Use Recharts `<LineChart>` with smooth curve

📊 **Card 2 — Engagement Activity**

- Metric summary:
  - Responses Received: 28 (+12.0% from last week)
  - Response Rate (Today): 87.5% (Compared to 82.3% yesterday)
- Bar chart comparing engagement by month
- Use Recharts `<BarChart>` with dual color bars (orange + green)

---

📈 **Customer Engagement Summary**

- Grid layout showing key KPIs:

  - Engagement Score: 8.4 / 10 (+6% from last month)
  - Active Contacts: 12,450
  - Inactive Contacts: 1,375
  - Lead Conversion Rate: 34% (+4.2% vs previous month)
  - Qualified Leads: 3,290
  - Unqualified Leads: 1,045

- Use cards with clear typography and small arrows for trend indication.

---

📋 **Customer Interactions Table**

- Section title: “Customer Interactions”
- Subtitle: “Review your customer engagement activities for this month.”
- Date filter on the top right (dropdown for month selection)
- Table columns:
  - Name (avatar + full name)
  - Interaction ID
  - Status (colored badge, e.g. “Follow-Up Scheduled”)
  - Channel (e.g. Email, Call, Meeting)
  - Date
- Rows styled with hover effect and alternating background
- Pagination or “Show all” link below table.

---

🧩 Components to use:

- `<Sidebar>` (custom component with groups)
- `<Card>`, `<CardHeader>`, `<CardContent>`
- `<Table>` (for customer interactions)
- `<Badge>` (for statuses)
- `<Input>` (for search)
- `<Select>` (for filters)
- `<DatePicker>`
- `<Button>` (for Export)
- `<LineChart>` and `<BarChart>` from Recharts
- `<Avatar>` for user photos
- `<useToast>` for feedback

---

🎨 Design system:

- Font: -apple-system, SF Pro Text, Roboto, system-ui
- Background: #FAFAFA
- Card background: white
- Accent color: #007AFF (System Blue)
- Neutral borders: #E5E5EA
- Rounded-2xl corners
- Padding: p-6 cards, p-8 layout
- Clean shadows and subtle grid lines for charts
- Smooth hover transitions

---

📦 Output:

- Complete `app/crm/page.tsx` with sidebar, dashboard metrics, charts, and table
- Mock data arrays for metrics and interactions
- Responsive layout (2-column on desktop, 1-column on mobile)
- Recharts integrated for live-looking analytics
- Ready to connect to real data source later
