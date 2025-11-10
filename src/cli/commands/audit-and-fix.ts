/**
 * Audit and Fix - Composite command for comprehensive analysis
 */

import chalk from 'chalk';
import * as path from 'path';
import { AuditAnalyzer } from '../audit-analyzer.js';
import { markAuditsReviewed } from '../../utils/audit-status.js';

export async function handleAuditAndFix(projectPath: string): Promise<void> {
  const auditLogPath = path.join(projectPath, 'docs', 'audits', 'AUDIT_LOG.json');

  console.log(chalk.cyan.bold('\n🚀 Audit and Fix - Comprehensive Analysis\n'));
  console.log(chalk.dim('This will analyze your audit log and help create tasks.\n'));

  try {
    // Step 1: Load and analyze
    console.log(chalk.blue('📊 Step 1/3: Analyzing audit log...\n'));

    const analyzer = AuditAnalyzer.loadFromFile(auditLogPath);
    const summary = analyzer.getSummary();
    const criticalIssues = analyzer.findCriticalIssues();

    if (summary.totalAudits === 0) {
      console.log(chalk.yellow('⚠️  No audits found. Please run audits first:\n'));
      console.log(chalk.dim('  mcp security-audit'));
      console.log(chalk.dim('  mcp a11y-audit'));
      console.log(chalk.dim('  mcp tech-debt\n'));
      return;
    }

    // Show quick summary
    console.log(chalk.bold(`Total audits: ${summary.totalAudits}`));
    console.log(chalk.bold(`Critical issues found: ${criticalIssues.length}\n`));

    if (criticalIssues.length === 0) {
      console.log(chalk.green('✅ No critical issues found! Your code is in good shape.\n'));
      markAuditsReviewed(projectPath);
      return;
    }

    // Step 2: Show analysis details
    console.log(chalk.blue('📋 Step 2/3: Issue breakdown\n'));

    // Group by severity
    const critical = criticalIssues.filter(i => i.severity === 'critical');
    const high = criticalIssues.filter(i => i.severity === 'high');

    console.log(chalk.red(`  🔴 Critical: ${critical.length}`));
    console.log(chalk.yellow(`  🟡 High: ${high.length}\n`));

    // Show top 5 issues
    console.log(chalk.bold('Top issues:\n'));
    criticalIssues.slice(0, 5).forEach((issue, idx) => {
      console.log(chalk.dim(`  ${idx + 1}. ${issue.type} in ${path.basename(issue.file || 'unknown')}`));
    });

    if (criticalIssues.length > 5) {
      console.log(chalk.dim(`  ... and ${criticalIssues.length - 5} more\n`));
    } else {
      console.log();
    }

    // Step 3: Ask to create tasks
    console.log(chalk.blue('🎯 Step 3/3: Task creation\n'));
    console.log(chalk.yellow(`Would you like to create ${criticalIssues.length} task${criticalIssues.length > 1 ? 's' : ''} from these issues?`));
    console.log(chalk.dim('Tasks will be added to docs/tasks/BACKLOG.json\n'));

    // In non-interactive mode or CI, show recommendation
    const isCI = process.env.CI === 'true';
    if (isCI) {
      console.log(chalk.dim('Running in CI mode - use --create-tasks to generate tasks\n'));
      markAuditsReviewed(projectPath);
      return;
    }

    // Interactive prompt (simplified - just show command)
    console.log(chalk.green('✅ Run this command to create tasks:'));
    console.log(chalk.cyan.bold('   mcp audit --create-tasks\n'));

    console.log(chalk.dim('Or view detailed analysis first:'));
    console.log(chalk.dim('   mcp audit --analyze\n'));

    // Mark as reviewed
    markAuditsReviewed(projectPath);

  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log(chalk.yellow('\n⚠️  Audit log not found.\n'));
      console.log(chalk.dim('Run audits first:'));
      console.log(chalk.dim('  mcp security-audit'));
      console.log(chalk.dim('  mcp a11y-audit\n'));
    } else {
      console.error(chalk.red('Failed to process audit log:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}
