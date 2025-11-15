#!/usr/bin/env bun

import { execSync } from "child_process";
import { Client } from "pg";

type Args = {
  companies: number;
  contactsPerCompany: number;
  quotes: number;
  orders: number;
  invoices: number;
  leads: number;
  deals: number;
  products: number;
  projects: number;
  tasksPerProject: number;
  employees: number;
  recruitment: number;
  performanceReviews: number;
  payroll: number;
  force: boolean;
  continueOnError: boolean;
  verbose: boolean;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const defaults: Args = {
    companies: 50,
    contactsPerCompany: 2,
    quotes: 50,
    orders: 50,
    invoices: 50,
    leads: 50,
    deals: 50,
    products: 50,
    projects: 50,
    tasksPerProject: 50,
    employees: 50,
    recruitment: 50,
    performanceReviews: 50,
    payroll: 50,
    force: true,
    continueOnError: false,
    verbose: true
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if (a === "--companies" && next) { defaults.companies = parseInt(next, 10); i++; }
    else if (a === "--contacts-per-company" && next) { defaults.contactsPerCompany = parseInt(next, 10); i++; }
    else if (a === "--quotes" && next) { defaults.quotes = parseInt(next, 10); i++; }
    else if (a === "--orders" && next) { defaults.orders = parseInt(next, 10); i++; }
    else if (a === "--invoices" && next) { defaults.invoices = parseInt(next, 10); i++; }
    else if (a === "--leads" && next) { defaults.leads = parseInt(next, 10); i++; }
    else if (a === "--deals" && next) { defaults.deals = parseInt(next, 10); i++; }
    else if (a === "--products" && next) { defaults.products = parseInt(next, 10); i++; }
    else if (a === "--projects" && next) { defaults.projects = parseInt(next, 10); i++; }
    else if (a === "--tasks-per-project" && next) { defaults.tasksPerProject = parseInt(next, 10); i++; }
    else if (a === "--employees" && next) { defaults.employees = parseInt(next, 10); i++; }
    else if (a === "--recruitment" && next) { defaults.recruitment = parseInt(next, 10); i++; }
    else if (a === "--performance-reviews" && next) { defaults.performanceReviews = parseInt(next, 10); i++; }
    else if (a === "--payroll" && next) { defaults.payroll = parseInt(next, 10); i++; }
    else if (a === "--force") { defaults.force = true; }
    else if (a === "--no-force") { defaults.force = false; }
    else if (a === "--continue-on-error") { defaults.continueOnError = true; }
    else if (a === "--verbose" || a === "-v") { defaults.verbose = true; }
  }

  return defaults;
}

function run(cmd: string, cwd: string, env: NodeJS.ProcessEnv) {
  execSync(cmd, { stdio: "inherit", cwd, env: { ...process.env, ...env } });
}

async function verify(apiUrl: string, dashboardUrl: string) {
  const api = new Client({ connectionString: apiUrl });
  const dash = new Client({ connectionString: dashboardUrl });
  await api.connect();
  await dash.connect();

  const apiChecks = [
    api.query("SELECT COUNT(*)::int AS c FROM accounts"),
    api.query("SELECT COUNT(*)::int AS c FROM account_contacts"),
    api.query("SELECT COUNT(*)::int AS c FROM quotes"),
    api.query("SELECT COUNT(*)::int AS c FROM orders"),
    api.query("SELECT COUNT(*)::int AS c FROM invoices"),
    api.query("SELECT COUNT(*)::int AS c FROM leads"),
    api.query("SELECT COUNT(*)::int AS c FROM deals"),
    api.query("SELECT COUNT(*)::int AS c FROM products"),
    api.query("SELECT COUNT(*)::int AS c FROM projects"),
    api.query("SELECT COUNT(*)::int AS c FROM project_tasks")
  ];

  const dashChecks = [
    dash.query("SELECT COUNT(*)::int AS c FROM companies"),
    dash.query("SELECT COUNT(*)::int AS c FROM users"),
    dash.query("SELECT COUNT(*)::int AS c FROM employees"),
    dash.query("SELECT COUNT(*)::int AS c FROM teamchat_users"),
    dash.query("SELECT COUNT(*)::int AS c FROM teamchat_channels"),
    dash.query("SELECT COUNT(*)::int AS c FROM chat_conversations"),
    dash.query("SELECT COUNT(*)::int AS c FROM notifications")
  ];

  const apiResults = await Promise.all(apiChecks);
  const dashResults = await Promise.all(dashChecks);

  await api.end();
  await dash.end();

  const values = {
    accounts: apiResults[0].rows[0].c,
    contacts: apiResults[1].rows[0].c,
    quotes: apiResults[2].rows[0].c,
    orders: apiResults[3].rows[0].c,
    invoices: apiResults[4].rows[0].c,
    leads: apiResults[5].rows[0].c,
    deals: apiResults[6].rows[0].c,
    products: apiResults[7].rows[0].c,
    projects: apiResults[8].rows[0].c,
    tasks: apiResults[9].rows[0].c,
    companies: dashResults[0].rows[0].c,
    users: dashResults[1].rows[0].c,
    employees: dashResults[2].rows[0].c,
    teamchatUsers: dashResults[3].rows[0].c,
    teamchatChannels: dashResults[4].rows[0].c,
    conversations: dashResults[5].rows[0].c,
    notifications: dashResults[6].rows[0].c
  };

  console.log(JSON.stringify(values, null, 2));
}

async function cleanDashboard(dashboardUrl: string) {
  const dash = new Client({ connectionString: dashboardUrl });
  await dash.connect();
  const tables = [
    "teamchat_messages",
    "teamchat_channel_members",
    "teamchat_channels",
    "teamchat_users",
    "chat_messages",
    "chat_conversations",
    "notifications",
    "vault_files",
    "vault_folders",
    "deals",
    "users",
    "companies",
    "employees"
  ];
  for (const t of tables) {
    try { await dash.query(`DELETE FROM ${t}`); } catch {}
  }
  await dash.end();
}

async function main() {
  const opts = parseArgs();

  const envApi: NodeJS.ProcessEnv = {
    SEED_COMPANY_COUNT: String(opts.companies),
    SEED_CONTACTS_PER_COMPANY: String(opts.contactsPerCompany),
    SEED_QUOTES_COUNT: String(opts.quotes),
    SEED_ORDERS_COUNT: String(opts.orders),
    SEED_INVOICES_COUNT: String(opts.invoices),
    SEED_LEADS_COUNT: String(opts.leads),
    SEED_DEALS_COUNT: String(opts.deals),
    SEED_PRODUCTS_COUNT: String(opts.products),
    SEED_PROJECT_COUNT: String(opts.projects),
    SEED_TASKS_PER_PROJECT: String(opts.tasksPerProject),
    SEED_EMPLOYEE_COUNT: String(opts.employees),
    SEED_RECRUITMENT_COUNT: String(opts.recruitment),
    SEED_PERFORMANCE_REVIEWS_COUNT: String(opts.performanceReviews),
    SEED_PAYROLL_COUNT: String(opts.payroll)
  };

  const apiUrl = process.env.COLLECTOR_DB_URL || process.env.API_DATABASE_URL || process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/collector";
  const dashboardUrl = process.env.COLLECTOR_DASHBOARD_DB_URL || process.env.DASHBOARD_DATABASE_URL || process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/collector_dashboard";

  const envDash: NodeJS.ProcessEnv = {
    DATABASE_URL: dashboardUrl,
    DASHBOARD_DATABASE_URL: dashboardUrl
  };

  envApi.DATABASE_URL = apiUrl;
  envApi.API_DATABASE_URL = apiUrl;
  envApi.SEED_SKIP_ACCOUNT_ADDRESSES = "true";
  envApi.SEED_RESET_LEADS = "true";

  run("bun scripts/migrate-and-seed.ts --drop --migrate-only", "apps/api", envApi);
  run(`psql "${apiUrl}" -f "src/db/migrations/0019_create_products_tables.sql"`, "apps/api", envApi);
  run(`psql "${apiUrl}" -f "src/db/migrations/0021_create_sales_deals.sql"`, "apps/api", envApi);
  run(
    `bun src/db/seed/index.ts ${opts.continueOnError ? "--continue-on-error" : ""} ${opts.verbose ? "--verbose" : ""}`.trim(),
    "apps/api",
    envApi
  );

  await cleanDashboard(dashboardUrl);

  run("bun lib/db/migrate.ts", "apps/dashboard", envDash);
  run(
    `bun lib/db/seed/index.ts --force ${opts.continueOnError ? "--continue-on-error" : ""} ${opts.verbose ? "--verbose" : ""}`.trim(),
    "apps/dashboard",
    envDash
  );
  run(
    `bun lib/db/seed/index.ts --only companies,employees,users,teamchat,chat,notifications --force ${opts.continueOnError ? "--continue-on-error" : ""} ${opts.verbose ? "--verbose" : ""}`.trim(),
    "apps/dashboard",
    envDash
  );

  await verify(apiUrl, dashboardUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});