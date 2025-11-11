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
| accounts   | Accounts: companies and contacts (50 + 100)           | None                |
| products   | Products: categories, locations, products, inventory  | None                |
| crm        | CRM: leads, activities, deals (60 + 60 + 50)          | auth, accounts      |
| sales      | Sales: quotes, orders, invoices (50 each)             | accounts, products  |
| projects   | Projects: projects with tasks, milestones (10)        | auth, accounts      |
| settings   | Settings: team members (8)                            | None                |

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
