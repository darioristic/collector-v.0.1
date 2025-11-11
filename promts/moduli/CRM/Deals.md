You are an expert Next.js + TypeScript + Prisma + Shadcn/UI developer.

Create a new page under `app/crm/deals` called **Deals Page** for a CRM system.

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

- Title: “Deals”
- Subtitle: “Manage your sales pipeline and track deal progress.”
- Button group:
  - “Add Deal” (opens modal)
  - “Switch View” (toggle between Kanban / Table / Compact)
  - “Filter” button

---

**2. Views**

#### 🟦 Kanban View

- Columns: “Lead”, “Qualified”, “Proposal”, “Negotiation”, “Closed Won”, “Closed Lost”
- Each deal is represented as a draggable card with:
  - Deal name
  - Company name
  - Deal value ($)
  - Status badge
  - Assigned sales rep (avatar)
- Drag-and-drop between columns should update deal status.

#### 📋 Table View

- Columns:
  - Deal Name
  - Company
  - Owner
  - Amount
  - Stage
  - Close Date
- Include sorting and filtering.

#### 🧩 Compact View

- Grid layout showing small cards with key info:
  - Deal title
  - Amount
  - Stage badge
  - Quick action menu (View / Edit / Delete)

---

### Modal: Add / Edit Deal

Form fields:

- Deal name
- Company
- Owner (select)
- Stage (enum)
- Value (number)
- Close date (date)
- Notes (textarea)
  Validation: required fields for name, stage, and value.

---

### Database (Prisma Model)

Add model in `schema.prisma`:

```prisma
model Deal {
  id          String   @id @default(cuid())
  title       String
  company     String
  owner       String
  stage       String
  value       Float
  closeDate   DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}


Seed Script (prisma/seed.ts)

Generate 60 sample deals with realistic randomized data for testing.
Stages: ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]



import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]

  for (let i = 0; i < 60; i++) {
    await prisma.deal.create({
      data: {
        title: faker.commerce.productName(),
        company: faker.company.name(),
        owner: faker.person.fullName(),
        stage: faker.helpers.arrayElement(stages),
        value: faker.number.int({ min: 500, max: 25000 }),
        closeDate: faker.date.future(),
        notes: faker.lorem.sentence(),
      }
    })
  }
}

main()
  .then(() => console.log('✅ 60 deals seeded'))
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())


UI Notes:

Use Shadcn components: Card, Badge, Table, Button, Dialog, Input, Select, Avatar, DropdownMenu.

Theme should be clean, business-oriented, consistent with Shadcn CRM Dashboard style.

Use responsive grid (mobile-friendly).

Default view: Kanban

Acceptance Criteria:

✅ Kanban board with drag-and-drop between stages
✅ Table view with sorting and filters
✅ Compact card grid view
✅ Add/Edit modal with validation
✅ 60 seed deals in the database
✅ All UI texts in English
✅ Fully responsive layout

Generate full implementation including:

page.tsx (main page)

components/kanban-board.tsx, table-view.tsx, compact-view.tsx, deal-form.tsx

prisma/schema.prisma model + seed script
```
