import chalk from 'chalk';
// @ts-ignore - AuditLogger might not be exported as class
import { AuditLogger } from '../../utils/audit-logger.js';

export interface AuditOptions {
  history?: string;
  summary?: boolean;
}

export async function auditCommand(options: AuditOptions): Promise<void> {
  const projectPath = process.cwd();
  const auditLogger = new AuditLogger(projectPath);

  if (options.history) {
    await handleAuditHistory(auditLogger, options.history);
  } else if (options.summary) {
    await handleAuditSummary(auditLogger);
  } else {
    console.log(chalk.yellow('Usage: mcp audit [--history <tool>] [--summary]'));
  }
}

async function handleAuditHistory(auditLogger: AuditLogger, toolName: string): Promise<void> {
  console.log(chalk.cyan.bold(`\n📊 Audit History: ${toolName}\n`));

  try {
    const history = await auditLogger.getToolHistory(toolName);

    if (!history || history.results.length === 0) {
      console.log(chalk.dim('No audit history found for this tool\n'));
      return;
    }

    console.log(chalk.bold('📈 Statistics'));
    console.log(chalk.dim(`   Total Executions: ${history.executionCount}`));
    console.log(chalk.dim(`   Last Executed: ${new Date(history.lastExecuted).toLocaleString()}`));
    console.log('');

    console.log(chalk.bold('📋 Recent Results'));
    console.log('');

    const recentResults = history.results.slice(-10).reverse();

    for (const result of recentResults) {
      const timestamp = new Date(result.timestamp).toLocaleString();
      const score = result.score || 'N/A';
      const grade = result.grade || 'N/A';

      console.log(chalk.green(`   ${timestamp}`));
      console.log(chalk.dim(`      Score: ${score} (Grade: ${grade})`));

      if (result.trends) {
        const trend = result.trends.scoreTrend;
        if (trend > 0) {
          console.log(chalk.dim(`      Trend: ${chalk.green('↑ +' + trend)}`));
        } else if (trend < 0) {
          console.log(chalk.dim(`      Trend: ${chalk.red('↓ ' + trend)}`));
        } else {
          console.log(chalk.dim(`      Trend: → no change`));
        }
      }

      console.log('');
    }

    if (history.results.length > 10) {
      console.log(chalk.dim(`   ... and ${history.results.length - 10} more results\n`));
    }

  } catch (error) {
    console.error(chalk.red('Failed to get audit history:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleAuditSummary(auditLogger: AuditLogger): Promise<void> {
  console.log(chalk.cyan.bold('\n📊 Audit Summary\n'));

  try {
    const summary = await auditLogger.getSummary();

    if (!summary || Object.keys(summary.tools).length === 0) {
      console.log(chalk.dim('No audit history found\n'));
      return;
    }

    console.log(chalk.bold('📈 Overall Statistics'));
    console.log(chalk.dim(`   Total Tools: ${Object.keys(summary.tools).length}`));
    console.log(chalk.dim(`   Total Executions: ${summary.totalExecutions || 0}`));
    console.log('');

    console.log(chalk.bold('🔧 By Tool'));
    console.log('');

    const tools = Object.entries(summary.tools).sort((a, b) => b[1].executionCount - a[1].executionCount);

    for (const [toolName, toolData] of tools) {
      const lastResult = toolData.results[toolData.results.length - 1];
      const score = lastResult?.score || 'N/A';
      const grade = lastResult?.grade || 'N/A';

      console.log(chalk.green(`   ${toolName}`));
      console.log(chalk.dim(`      Executions: ${toolData.executionCount}`));
      console.log(chalk.dim(`      Last Score: ${score} (Grade: ${grade})`));
      console.log(chalk.dim(`      Last Run: ${new Date(toolData.lastExecuted).toLocaleString()}`));
      console.log('');
    }

    console.log(chalk.dim('💡 Tip: Use `mcp audit --history <tool>` for detailed history\n'));

  } catch (error) {
    console.error(chalk.red('Failed to get audit summary:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
