# Development Scripts

## Enhanced Development Environment Manager

Intelligent development workflow script that orchestrates your entire dev environment.

### Features

- 🎨 **Beautiful UI** - Colored output with progress indicators
- 🧠 **Smart Detection** - Automatically detects and manages state
- ⚡ **Quick Mode** - Skip seeding if database already has data
- 🔍 **Health Checks** - Monitors all services
- 🛡️ **Error Recovery** - Graceful error handling and cleanup
- 📊 **Status Dashboard** - Real-time service status
- 🚀 **Flexible** - Multiple modes and options

### Quick Start

```bash
# Standard development (migrate + seed + start)
bun run dev

# Quick start (skip seed if data exists)
bun run dev --quick

# Skip seeding entirely
bun run dev --skip-seed
```

### Usage

```bash
bun run dev [options]
```

### Modes

#### Local Mode (Default)
Uses local PostgreSQL and Redis instances.

```bash
bun run dev
```

#### Docker Mode
Uses Docker Compose for all infrastructure.

```bash
bun run dev --docker
```

### Seeding Options

Control how database seeding works:

```bash
# Skip database seeding
bun run dev --skip-seed

# Quick start - skip seed if DB has data
bun run dev --quick

# Seed only specific modules
bun run dev --only=auth,accounts

# Skip specific seed modules
bun run dev --skip=crm,projects

# Combine options
bun run dev --only=auth,accounts --verbose
```

### Environment Variables

The script respects these environment variables:

```bash
API_PORT=4000          # API server port
WEB_PORT=3000          # Frontend port
DATABASE_URL=...       # PostgreSQL connection string
REDIS_URL=...          # Redis connection string
```

### What It Does

1. **Environment Setup**
   - Loads .env files
   - Parses command-line arguments
   - Validates configuration

2. **Port Management**
   - Checks if ports are free
   - Kills processes on occupied ports
   - Prevents port conflicts

3. **Database Setup**
   - Creates database if it doesn't exist
   - Runs migrations (drizzle-kit push)
   - Seeds database with test data

4. **Service Orchestration**
   - Starts API server (Fastify)
   - Starts Frontend server (Next.js)
   - Monitors all processes

5. **Status Monitoring**
   - Real-time service status
   - Health checks
   - Uptime tracking

6. **Graceful Shutdown**
   - Handles Ctrl+C gracefully
   - Stops all child processes
   - Cleans up Docker containers (if used)

### Output Example

```
============================================================
Local Development Workflow
============================================================

  ● Database              collector_dashboard
  ● Host                  localhost:5432
  ● Mode                  Local

▶ Checking ports... [0s 123ms]
✓ Port 4000 freed

▶ Setting up database... [1s 234ms]
ℹ Database "collector_dashboard" already exists

▶ Running database migrations... [1s 456ms]
✓ Migrations completed

▶ Seeding database... [2s 789ms]
✓ Database seeded

▶ Starting development servers... [3s 12ms]

============================================================
Development Environment Ready
============================================================

  ✅ API Server            http://localhost:4000
  ✅ Frontend              http://localhost:3000
  ✅ Database              collector_dashboard

Services Status
----------------------------------------
  ✅ PostgreSQL           running:5432 (5s)
  ✅ API                  running:4000 (3s)
  ✅ Frontend             running:3000 (2s)

╔═══════════════════════════════════════════════════════════╗
║  Development environment is ready!                        ║
╠═══════════════════════════════════════════════════════════╣
║  API:      http://localhost:4000                          ║
║  Frontend: http://localhost:3000                          ║
╠═══════════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop all services                        ║
╚═══════════════════════════════════════════════════════════╝
```

### Examples

#### Standard Development

```bash
bun run dev
```

Full workflow:
- Check and free ports
- Create database if needed
- Run migrations
- Seed database
- Start API and Frontend

#### Quick Start (Development Iteration)

```bash
bun run dev --quick
```

Same as standard, but skips seeding if database already has data. Perfect for:
- Restarting after code changes
- Resuming work
- Testing with existing data

#### Fresh Start

```bash
# Reset database first
cd apps/api
bun run db:reset

# Then start dev
cd ../..
bun run dev
```

#### Selective Seeding

```bash
# Only seed auth and accounts (for testing auth)
bun run dev --only=auth,accounts

# Seed everything except slow modules
bun run dev --skip=crm,sales,projects
```

#### Docker Development

```bash
# Use Docker for all infrastructure
bun run dev --docker
```

Useful for:
- Isolating services
- Testing deployment setup
- Ensuring reproducibility

### Troubleshooting

#### Port Already in Use

The script automatically attempts to free ports. If it fails:

```bash
# Manually kill processes on port 4000
lsof -ti:4000 | xargs kill -9

# Then restart
bun run dev
```

#### Database Connection Failed

Check PostgreSQL is running:

```bash
# For local PostgreSQL
psql -U postgres -l

# For Docker
docker ps | grep postgres
```

#### Seed Fails

Run seed with verbose logging:

```bash
cd apps/api
bun run db:seed --verbose
```

Or skip seeding:

```bash
bun run dev --skip-seed
```

#### Service Won't Start

Check the logs:

```bash
# API logs
cd apps/api
bun run dev

# Frontend logs
cd apps/dashboard
bun run dev
```

### Advanced Usage

#### Custom Ports

```bash
API_PORT=5000 WEB_PORT=4000 bun run dev
```

#### Custom Database

```bash
DATABASE_URL="postgres://user:pass@localhost:5432/mydb" bun run dev
```

#### Verbose Logging

```bash
bun run dev --verbose
```

Shows detailed logs for debugging.

### Architecture

The script is organized into logical sections:

1. **Logger** - Colored, timestamped logging
2. **State Management** - Tracks service states
3. **Environment** - Loads config and parses args
4. **Utilities** - Port management, command execution
5. **Database** - Setup, migration, seeding
6. **Docker** - Docker Compose orchestration
7. **Process Management** - Spawn and monitor services
8. **Shutdown** - Graceful cleanup
9. **Workflows** - Docker and Local workflows

### Best Practices

1. **Use Quick Mode for Iteration**
   ```bash
   bun run dev --quick
   ```

2. **Reset Database Periodically**
   ```bash
   cd apps/api && bun run db:reset
   ```

3. **Selective Seeding for Speed**
   ```bash
   bun run dev --only=auth,accounts
   ```

4. **Use Docker for Clean State**
   ```bash
   bun run dev --docker
   ```

5. **Check Status After Start**
   Wait for the status dashboard to show all services running.

### Related Files

- [scripts/dev.ts](./dev.ts) - Main development script
- [apps/api/src/db/seed/](../apps/api/src/db/seed/) - Database seed modules
- [apps/api/package.json](../apps/api/package.json) - Database scripts
- [docker-compose.yml](../docker-compose.yml) - Docker infrastructure

### See Also

- [Database Seeding Documentation](../apps/api/src/db/seed/README.md)
- [API Documentation](../apps/api/README.md)
- [Frontend Documentation](../apps/dashboard/README.md)
