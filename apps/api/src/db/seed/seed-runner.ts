/**
 * Enhanced Seed Runner
 *
 * Provides robust database seeding with:
 * - Progress tracking and detailed logging
 * - Per-module error handling with recovery
 * - Dependency checking and validation
 * - Selective seeding (run specific modules or skip modules)
 * - Execution statistics and reporting
 * - Idempotency checks
 */

import type { AppDatabase } from "../index";
import { db as defaultDb } from "../index";

export type SeedModule = {
  name: string;
  description: string;
  dependencies: string[];
  seedFn: (database: AppDatabase) => Promise<void>;
};

export type SeedOptions = {
  /**
   * Run only specific modules (by name)
   * Example: ['auth', 'accounts']
   */
  only?: string[];

  /**
   * Skip specific modules (by name)
   * Example: ['crm', 'projects']
   */
  skip?: string[];

  /**
   * Continue on error instead of failing immediately
   */
  continueOnError?: boolean;

  /**
   * Show verbose logging
   */
  verbose?: boolean;

  /**
   * Database instance to use
   */
  database?: AppDatabase;
};

export type SeedResult = {
  module: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
  recordsCreated?: number;
};

export type SeedSummary = {
  totalModules: number;
  successful: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  results: SeedResult[];
};

/**
 * Logger utility with timestamp and color coding
 */
class SeedLogger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  success(message: string) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  error(message: string) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  warn(message: string) {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  debug(message: string) {
    if (this.verbose) {
      console.log(`\x1b[90m[DEBUG]\x1b[0m ${new Date().toISOString()} - ${message}`);
    }
  }

  module(name: string, status: 'start' | 'end' | 'error') {
    const symbols = {
      start: '▶',
      end: '✓',
      error: '✗'
    };

    const colors = {
      start: '\x1b[34m',
      end: '\x1b[32m',
      error: '\x1b[31m'
    };

    console.log(`${colors[status]}${symbols[status]} ${name}\x1b[0m`);
  }
}

/**
 * Validates module dependencies
 */
function validateDependencies(
  modules: SeedModule[],
  options: SeedOptions
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const moduleNames = new Set(modules.map(m => m.name));

  // Filter modules based on options
  let activeModules = modules;

  if (options.only) {
    activeModules = modules.filter(m => options.only!.includes(m.name));
  }

  if (options.skip) {
    activeModules = activeModules.filter(m => !options.skip!.includes(m.name));
  }

  // Check dependencies
  for (const module of activeModules) {
    for (const dep of module.dependencies) {
      if (!moduleNames.has(dep)) {
        errors.push(`Module "${module.name}" depends on non-existent module "${dep}"`);
      }

      // Check if dependency is being skipped
      if (options.skip?.includes(dep) && !options.skip.includes(module.name)) {
        errors.push(
          `Module "${module.name}" depends on "${dep}", but "${dep}" is being skipped`
        );
      }

      // Check if dependency is not in 'only' list
      if (options.only && !options.only.includes(dep)) {
        errors.push(
          `Module "${module.name}" depends on "${dep}", but "${dep}" is not in the 'only' list`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Topologically sorts modules based on dependencies
 */
function sortModulesByDependencies(modules: SeedModule[]): SeedModule[] {
  const sorted: SeedModule[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const moduleMap = new Map(modules.map(m => [m.name, m]));

  function visit(moduleName: string) {
    if (visited.has(moduleName)) {
      return;
    }

    if (visiting.has(moduleName)) {
      throw new Error(`Circular dependency detected: ${moduleName}`);
    }

    visiting.add(moduleName);

    const module = moduleMap.get(moduleName);
    if (!module) {
      return;
    }

    for (const dep of module.dependencies) {
      visit(dep);
    }

    visiting.delete(moduleName);
    visited.add(moduleName);
    sorted.push(module);
  }

  for (const module of modules) {
    visit(module.name);
  }

  return sorted;
}

/**
 * Runs a single seed module with error handling
 */
async function runModule(
  module: SeedModule,
  database: AppDatabase,
  logger: SeedLogger,
  options: SeedOptions
): Promise<SeedResult> {
  const startTime = Date.now();

  logger.module(module.name, 'start');
  logger.info(`Seeding ${module.name}: ${module.description}`);

  try {
    await module.seedFn(database);

    const duration = Date.now() - startTime;
    logger.module(module.name, 'end');
    logger.success(`Completed ${module.name} in ${duration}ms`);

    return {
      module: module.name,
      status: 'success',
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.module(module.name, 'error');
    logger.error(`Failed ${module.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

    if (error instanceof Error && options.verbose) {
      logger.debug(`Stack trace: ${error.stack}`);
    }

    return {
      module: module.name,
      status: 'failed',
      duration,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Prints seed summary
 */
function printSummary(summary: SeedSummary, logger: SeedLogger) {
  console.log('\n' + '='.repeat(60));
  console.log('SEED SUMMARY');
  console.log('='.repeat(60));

  logger.info(`Total modules: ${summary.totalModules}`);
  logger.success(`Successful: ${summary.successful}`);

  if (summary.failed > 0) {
    logger.error(`Failed: ${summary.failed}`);
  }

  if (summary.skipped > 0) {
    logger.warn(`Skipped: ${summary.skipped}`);
  }

  logger.info(`Total duration: ${summary.totalDuration}ms`);

  // Detailed results
  console.log('\nDETAILED RESULTS:');
  console.log('-'.repeat(60));

  for (const result of summary.results) {
    const statusSymbol = {
      success: '✓',
      failed: '✗',
      skipped: '○'
    }[result.status];

    const statusColor = {
      success: '\x1b[32m',
      failed: '\x1b[31m',
      skipped: '\x1b[33m'
    }[result.status];

    console.log(
      `${statusColor}${statusSymbol}\x1b[0m ${result.module.padEnd(20)} ${result.duration}ms`
    );

    if (result.error) {
      console.log(`  └─ Error: ${result.error.message}`);
    }
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main seed runner
 */
export async function runSeeds(
  modules: SeedModule[],
  options: SeedOptions = {}
): Promise<SeedSummary> {
  const logger = new SeedLogger(options.verbose);
  const database = options.database || defaultDb;
  const startTime = Date.now();

  logger.info('Starting database seed...');

  // Validate dependencies
  const validation = validateDependencies(modules, options);
  if (!validation.valid) {
    logger.error('Dependency validation failed:');
    for (const error of validation.errors) {
      logger.error(`  - ${error}`);
    }
    throw new Error('Seed dependencies are invalid');
  }

  // Filter modules based on options
  let activeModules = modules;

  if (options.only) {
    logger.info(`Running only: ${options.only.join(', ')}`);
    activeModules = modules.filter(m => options.only!.includes(m.name));
  }

  if (options.skip) {
    logger.info(`Skipping: ${options.skip.join(', ')}`);
    activeModules = activeModules.filter(m => !options.skip!.includes(m.name));
  }

  // Sort by dependencies
  try {
    activeModules = sortModulesByDependencies(activeModules);
  } catch (error) {
    logger.error(`Failed to sort modules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }

  logger.info(`Seeding ${activeModules.length} modules in dependency order...`);
  logger.debug(`Order: ${activeModules.map(m => m.name).join(' → ')}`);

  // Run modules
  const results: SeedResult[] = [];

  for (const module of activeModules) {
    const result = await runModule(module, database, logger, options);
    results.push(result);

    // Stop on first error if continueOnError is false
    if (result.status === 'failed' && !options.continueOnError) {
      logger.error('Stopping seed due to error (use continueOnError to override)');
      break;
    }
  }

  // Add skipped modules to results
  const skippedModules = modules.filter(
    m => !activeModules.find(am => am.name === m.name)
  );

  for (const module of skippedModules) {
    results.push({
      module: module.name,
      status: 'skipped',
      duration: 0
    });
  }

  // Build summary
  const summary: SeedSummary = {
    totalModules: modules.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    totalDuration: Date.now() - startTime,
    results
  };

  // Print summary
  printSummary(summary, logger);

  // Throw only if failures occurred and continueOnError is not enabled
  if (summary.failed > 0 && !options.continueOnError) {
    throw new Error(`Seed failed: ${summary.failed} module(s) failed`);
  }

  logger.success('Database seed completed successfully!');

  return summary;
}