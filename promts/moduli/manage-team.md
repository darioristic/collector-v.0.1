Create a modern “Manage Team” page inside the Company Settings section using Next.js 15 + TypeScript with Tailwind CSS and Shadcn UI components.

Goal:
The page should replicate the clean, minimal layout from the provided reference image — a professional team management interface with a left sidebar and a main content area listing team members.

---

🧱 Tech stack:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Lucide-react icons
- React Hook Form + Zod (for Add/Edit member modal)
- Toast notifications
- API routes for managing team members (mock)

---

📁 File structure:

- `app/settings/company/team/page.tsx`
- `app/api/team/route.ts`
- `lib/validations/team.ts`

---

📄 Layout requirements:

1. **Page wrapper**

   - Two-column layout:
     - Left sidebar for navigation
     - Right main content area
   - Background: #FAFAFA
   - Rounded corners, subtle shadows on cards
   - Font: system font stack (-apple-system, SF Pro Text, Roboto, system-ui)

2. **Left Sidebar Navigation**

   - Label: “Company Settings”
   - Menu items:
     - General
     - Billings
     - Invoices
     - Team Members (active)
     - Notifications
     - Security & Privacy
     - Domains
   - Bottom section: “Top Browsers” with small icon row (Chrome, Safari, Edge)
   - Active item highlighted with accent border or background.

3. **Main Content Area**
   - Page title: “Manage Team”
   - Subtitle: “Manage your members and edit their roles and permissions.”
   - Search bar at top with placeholder: “Search members…”
   - Button on top right: “Add member” (Shadcn Button with icon)
   - Sort & Filter dropdown and status filter buttons (“All”, “Online”, “Idle”, “Offline”)
   - Data table styled with:
     - Columns: Member, Date added, Status, Role(s), Actions
     - Rows: show avatar, name, email, date, colored status dot, and role
     - Buttons:
       - “Manage” (secondary button)
       - Trash icon button for delete (ghost variant)
   - “Show all (43)” link at bottom

---

💡 UI behavior:

- Clicking “Add member” opens a modal dialog with form fields:
  - Full Name (required)
  - Email (required, valid email)
  - Role (select: Admin, Designer, Researcher, Developer, Manager, Marketing)
  - Status (select: Online, Idle, Offline)
  - Save / Cancel buttons
- “Manage” button opens same modal pre-filled for editing.
- “Trash” button triggers confirmation dialog before removing member.
- Search filters list in real-time by name or email.
- Sort by Name or Date Added.
- Status filter buttons change visible rows (toggle active button style).

---

🧠 Backend mock (app/api/team/route.ts):

- GET → returns JSON list of members
- POST → adds new member
- PUT → edits member
- DELETE → removes member
- Simulate DB via in-memory array or mock Prisma

---

🎨 Design system:

- Accent color: #007AFF (System Blue)
- Card + Table background: white
- Subtle gray borders (#E5E5EA)
- Rounded-2xl corners
- Padding: p-6 cards, p-8 layout
- Hover states on rows
- Smooth transitions and spacing using Tailwind `gap-4`, `space-y-6`
- Status dot colors:
  - Online: #34C759
  - Offline: #FF3B30
  - Idle: #FFCC00

---

🧩 Components to use:

- `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`
- `<Input>` (for search)
- `<Select>` (for filters and form)
- `<Button>` (primary/secondary/ghost)
- `<Dialog>` (for Add/Edit)
- `<Table>` (for team list)
- `<Badge>` (for roles)
- `<Avatar>` (for profile picture)
- `<useToast>` (for notifications)

---

📦 Output:

- Full working Next.js page with sidebar layout, data table, modals, filtering, and backend mock routes.
- Designed to match the example interface visually and functionally.
