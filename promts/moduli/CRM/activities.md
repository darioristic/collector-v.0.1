You are an expert Next.js + TypeScript + Prisma + Shadcn/UI developer.

Create a new page under `app/crm/activities` called **Client Activities** for a CRM system to track activities related to clients, such as meetings, follow-ups, calls, and scheduled actions.

### Requirements:

**Tech stack:**

- Next.js 14 (App Router)
- Prisma (with PostgreSQL)
- TailwindCSS + Shadcn UI components
- React Hook Form, Zustand or Context for state management
- Lucide icons for UI
- Language: English (UI labels, texts, etc.)

---

### Page Structure:

**1. Header**

- Title: “Client Activities”
- Subtitle: “Track all your scheduled tasks, meetings, and actions related to clients.”
- Button group:
  - “Add Activity” (opens modal for creating tasks, meetings, etc.)
  - “Filter” button (by client, activity type, date, etc.)

---

### Views

#### 🗓 Calendar View

- The calendar view should display scheduled activities as events in the calendar.
  - Users can click on a date to add new activities.
  - Activities will be displayed as events on the respective dates, showing:
    - Activity title
    - Client name
    - Assigned person (avatar)
    - Time and date of the activity
    - Status (Scheduled, In Progress, Completed, Missed)
  - Hovering over an activity will show quick actions (Edit, Complete, Missed).

#### 📋 List View

- The list view will display activities in a scrollable table format with the following columns:
  - Activity Title (e.g., "Call with Client", "Meeting with Partner")
  - Client (linked to the client profile)
  - Due Date (date and time)
  - Status (Scheduled, In Progress, Completed, Missed)
  - Priority (High, Medium, Low)
  - Assigned To (name or avatar)
  - Action: (Edit, Mark Complete, Cancel, etc.)
- Sorting and filtering should be available by activity name, client, date, status, and priority.

#### 🧩 Compact View

- A more condensed version of the list view in a grid layout showing smaller cards with key info:
  - Activity title
  - Client name
  - Due date/time
  - Status badge (Scheduled, In Progress, Completed, Missed)
  - Priority level (High, Medium, Low)
  - Quick action buttons (View, Edit, Mark Complete, etc.)

---

### Modal: Add / Edit Activity

Form fields:

- Activity Name
- Client (select from CRM client list)
- Assigned To (select user)
- Activity Type (enum: Call, Meeting, Task, Follow-up)
- Due Date (date/time picker)
- Priority (enum: High, Medium, Low)
- Notes (optional description)
- Status (Scheduled, In Progress, Completed, Missed)
  Validation: required fields for title, type, date/time, and status.

---

### Database (Prisma Model)

Add model in `schema.prisma`:

```prisma
model Activity {
  id          String   @id @default(cuid())
  title       String
  clientId    String
  assignedTo  String
  type        String
  dueDate     DateTime
  status      String
  priority    String
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  client      Client  @relation(fields: [clientId], references: [id])
  user        User    @relation(fields: [assignedTo], references: [id])
}




# Example seed
import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  const statuses = ["Scheduled", "In Progress", "Completed", "Missed"]
  const priorities = ["High", "Medium", "Low"]
  const types = ["Task", "Meeting", "Call", "Follow-up"]

  for (let i = 0; i < 60; i++) {
    const randomClientId = await prisma.client.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })
    const randomAssignedTo = await prisma.user.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    await prisma.activity.create({
      data: {
        title: faker.lorem.sentence(),
        clientId: randomClientId?.id ?? null,
        assignedTo: randomAssignedTo?.id ?? null,
        type: faker.helpers.arrayElement(types),
        dueDate: faker.date.soon(),
        status: faker.helpers.arrayElement(statuses),
        priority: faker.helpers.arrayElement(priorities),
        notes: faker.lorem.sentence(),
      }
    })
  }
}

main()
  .then(() => console.log('✅ 60 activities seeded'))
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
```

UI Notes:

Use Shadcn components: Card, Badge, Table, Button, Dialog, Input, Select, Avatar, DropdownMenu, Switch.

Theme should be clean, business-oriented, consistent with Shadcn CRM Dashboard style.

Use responsive grid (mobile-friendly).

Default view: Calendar or List View

Acceptance Criteria:

✅ Calendar view to see scheduled activities by day
✅ List view with sorting and filters
✅ Compact card grid view for summarized info
✅ Add/Edit modal with validation
✅ 60 seed activities in the database
✅ All UI texts in English
✅ Fully responsive layout

Full Implementation Includes:

page.tsx (main page)

components/calendar-view.tsx, list-view.tsx, compact-view.tsx, activity-form.tsx

prisma/schema.prisma model + seed script
