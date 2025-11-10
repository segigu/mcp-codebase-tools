import chalk from 'chalk';
// @ts-ignore - CacheManager might not be exported as class
import { CacheManager } from '../../utils/cache-manager.js';

export interface CacheOptions {
  status?: boolean;
  clear?: string | boolean;
}

export async function cacheCommand(options: CacheOptions): Promise<void> {
  const projectPath = process.cwd();
  const cacheManager = new CacheManager(projectPath);

  if (options.clear !== undefined) {
    await handleClearCache(cacheManager, options.clear);
  } else {
    await handleCacheStatus(cacheManager);
  }
}

async function handleCacheStatus(cacheManager: CacheManager): Promise<void> {
  console.log(chalk.cyan.bold('\n💾 Cache Status\n'));

  const stats = await cacheManager.getStats();

  console.log(chalk.bold('📊 Overall Statistics'));
  console.log(chalk.dim(`   Total Entries: ${stats.totalEntries}`));
  console.log(chalk.dim(`   Total Size: ${formatBytes(stats.totalSize)}`));
  console.log(chalk.dim(`   Hit Rate: ${formatPercentage(stats.hitRate)}`));
  console.log(chalk.dim(`   Miss Rate: ${formatPercentage(stats.missRate)}`));
  console.log('');

  if (stats.byTool && Object.keys(stats.byTool).length > 0) {
    console.log(chalk.bold('🔧 By Tool'));
    console.log('');

    for (const [tool, toolStats] of Object.entries(stats.byTool)) {
      const hitRate = toolStats.hits + toolStats.misses > 0
        ? (toolStats.hits / (toolStats.hits + toolStats.misses)) * 100
        : 0;

      console.log(chalk.green(`   ${tool}`));
      console.log(chalk.dim(`      Hits: ${toolStats.hits}`));
      console.log(chalk.dim(`      Misses: ${toolStats.misses}`));
      console.log(chalk.dim(`      Hit Rate: ${hitRate.toFixed(1)}%`));
      console.log('');
    }
  }

  // Recommendations
  if (stats.hitRate < 0.5) {
    console.log(chalk.yellow('⚠️  Low cache hit rate detected'));
    console.log(chalk.dim('   Consider increasing TTL values in mcp.config.js\n'));
  } else if (stats.hitRate > 0.8) {
    console.log(chalk.green('✓ Excellent cache performance!\n'));
  }

  console.log(chalk.dim('💡 Tip: Use `mcp cache clear` to clear all cache'));
  console.log(chalk.dim('💡 Tip: Use `mcp cache clear <tool>` to clear specific tool cache\n'));
}

async function handleClearCache(cacheManager: CacheManager, toolName: string | boolean): Promise<void> {
  if (typeof toolName === 'string') {
    // Clear specific tool cache
    console.log(chalk.cyan(`\n🗑️  Clearing cache for: ${toolName}\n`));

    try {
      await cacheManager.clearTool(toolName);
      console.log(chalk.green(`✓ Cache cleared for ${toolName}\n`));
    } catch (error) {
      console.error(chalk.red('Failed to clear cache:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  } else {
    // Clear all cache
    console.log(chalk.cyan('\n🗑️  Clearing all cache\n'));

    try {
      await cacheManager.clearAll();
      console.log(chalk.green('✓ All cache cleared\n'));
    } catch (error) {
      console.error(chalk.red('Failed to clear cache:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
