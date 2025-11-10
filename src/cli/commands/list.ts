import chalk from 'chalk';
import { TOOL_REGISTRY } from '../../utils/tool-registry.js';

export interface ListOptions {
  category?: string;
  verbose?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  console.log(chalk.cyan.bold('\n📋 Available MCP Tools\n'));

  const tools = Object.entries(TOOL_REGISTRY);

  // Group by category
  const grouped: Record<string, any[]> = {};

  for (const [id, tool] of tools) {
    const category = tool.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({ id, ...tool });
  }

  // Filter by category if specified
  const categoriesToShow = options.category
    ? Object.keys(grouped).filter(cat => cat.toLowerCase() === options.category?.toLowerCase())
    : Object.keys(grouped).sort();

  if (categoriesToShow.length === 0) {
    console.log(chalk.red(`No tools found in category: ${options.category}`));
    console.log(chalk.dim('\nAvailable categories:'));
    Object.keys(grouped).sort().forEach(cat => {
      console.log(chalk.dim(`  • ${cat}`));
    });
    return;
  }

  // Display tools by category
  for (const category of categoriesToShow) {
    const categoryTools = grouped[category];

    console.log(chalk.bold.yellow(`${getCategoryIcon(category)} ${category}`));
    console.log(chalk.dim(`   ${categoryTools.length} tools\n`));

    for (const tool of categoryTools) {
      console.log(chalk.green(`   mcp ${tool.command}`));
      console.log(chalk.dim(`      ${tool.description}`));

      if (options.verbose) {
        if (tool.complexity) {
          console.log(chalk.dim(`      Complexity: ${tool.complexity}`));
        }
        if (tool.estimatedTokens) {
          console.log(chalk.dim(`      Est. tokens: ${tool.estimatedTokens.withMcp} (saves ${tool.estimatedTokens.percentage}%)`));
        }
      }

      console.log('');
    }
  }

  // Summary
  const totalTools = tools.length;
  console.log(chalk.cyan(`📊 Total: ${totalTools} tools across ${Object.keys(grouped).length} categories\n`));

  if (!options.verbose) {
    console.log(chalk.dim('💡 Tip: Use --verbose for more details'));
    console.log(chalk.dim('💡 Tip: Use mcp describe <tool> for tool-specific help\n'));
  }
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Audit': '🔒',
    'Navigate': '🔍',
    'Search': '📋',
    'Refactor': '🔧',
    'Composite': '🎯',
    'Utility': '⚙️',
    'Performance': '⚡',
    'Frontend': '🎨',
    'i18n': '🌐',
    'Documentation': '📚',
    'Testing': '🧪',
    'Security': '🛡️'
  };

  return icons[category] || '📦';
}
