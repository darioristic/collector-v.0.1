# Database Seeding System

Enhanced database seeding system with robust error handling, progress tracking, and flexible options.

## Features

- ✅ **Progress Tracking** - Detailed logging with timestamps and colored output
- ✅ **Error Handling** - Per-module error handling with detailed stack traces
- ✅ **Dependency Management** - Automatic dependency resolution and validation
- ✅ **Selective Seeding** - Run specific modules or skip modules
- ✅ **Idempotent** - Safe to run multiple times (upserts data)
- ✅ **Statistics** - Execution time and success/failure reports

## Quick Start

```bash
# Seed everything
cd apps/api
bun run db:seed

# Get help
bun run db:seed:help

# Reset database (drop tables, migrate, seed)
bun run db:reset

# Setup database (migrate and seed)
bun run db:setup
```

## Available Modules

| Module     | Description                                           | Dependencies        |
|------------|-------------------------------------------------------|---------------------|
| auth       | Authentication: roles, companies, users               | None                |
| accounts   | Accounts: companies, contacts, addresses (50 + 100 + ~65) | None                |
| products   | Products: categories, locations, products, inventory  | None                |
| crm        | CRM: leads, opportunities, activities, deals, notes (60 + 45 + 35 + 50 + 30) | auth, accounts      |
| sales      | Sales: quotes, orders, invoices, payments, deals (50 + 50 + 50 + ~30 + ~25) | accounts, products, crm |
| projects   | Projects: projects, teams, tasks, milestones, time entries (10 + ~15 + 250 + 50 + ~200) | auth, accounts      |
| settings   | Settings: team members, permissions, integrations (8 + ~25 + 4) | auth                |
| hr         | HR: employees, role assignments, attendance, time off, payroll | auth                |
| notifications | Notifications: various notification types for users | auth                |

## Command Line Options

### Basic Seed Script

```bash
cd apps/api
bun run db:seed [options]
```

Options:
- `--only <modules>` - Run only specific modules (comma-separated)
- `--skip <modules>` - Skip specific modules (comma-separated)
- `--continue-on-error` - Continue seeding even if a module fails
- `--verbose, -v` - Show verbose logging including debug messages
- `--help, -h` - Show help message

### Interactive Development Script

For a better development experience with interactive seed selection:

```bash
# From project root
bun run dev:interactive
```

**Features:**
- **Infrastructure Setup**: Automatically starts Docker services (PostgreSQL, Redis) or uses local services
- **Interactive Seed Menu**: Choose which modules to seed with a user-friendly menu
- **Dependency Resolution**: Automatically includes required dependencies
- **Confirmation**: Review and confirm before seeding
- **Dev Server Startup**: Starts API and Frontend servers after seeding

**Interactive Menu Options:**
- Enter module numbers (e.g., `1,2,3`) or names (e.g., `auth,accounts`)
- Type `a` or `all` to seed all modules
- Type `s` or `skip` to skip seeding
- Type `q` or `quit` to exit

**Example Workflow:**
1. Run `bun run dev:interactive` from project root
2. Choose infrastructure (Docker or local)
3. Select seed modules from the menu
4. Review and confirm selected modules (including dependencies)
5. Script seeds database and starts dev servers

## Examples

### Seed Everything

```bash
bun run db:seed
```

### Seed Only Specific Modules

```bash
# Seed only auth and accounts
bun run db:seed --only auth,accounts

# Seed everything except CRM and projects
bun run db:seed --skip crm,projects
```

### Reset Database

```bash
# Drop all tables, run migrations, and seed
bun run db:reset

# With verbose logging
bun run db:reset --verbose
```

## Best Practices

### 1. Keep Seeds Idempotent

Always use `onConflictDoUpdate` or `onConflictDoNothing`:

```typescript
await tx.insert(table)
  .values(data)
  .onConflictDoUpdate({
    target: table.id,
    set: { ...updates }
  });
```

### 2. Use Transactions

Wrap all seed operations in transactions:

```typescript
await database.transaction(async (tx) => {
  // All operations here are atomic
  await tx.insert(...);
  await tx.insert(...);
});
```

### 3. Validate Dependencies

Always list module dependencies explicitly:

```typescript
{
  name: "sales",
  dependencies: ["accounts", "products"],
  seedFn: seedSales
}
```
