import chalk from 'chalk';
import * as path from 'path';
// @ts-ignore - AuditLogger might not be exported as class
import { AuditLogger } from '../../utils/audit-logger.js';
import { AuditAnalyzer } from '../audit-analyzer.js';
import { TaskGenerator } from '../task-generator.js';

export interface AuditOptions {
  history?: string;
  summary?: boolean;
  analyze?: boolean;
  createTasks?: boolean;
}

export async function auditCommand(options: AuditOptions): Promise<void> {
  const projectPath = process.cwd();
  const auditLogger = new AuditLogger(projectPath);

  if (options.analyze) {
    await handleAuditAnalyze(projectPath);
  } else if (options.createTasks) {
    await handleAuditCreateTasks(projectPath);
  } else if (options.history) {
    await handleAuditHistory(auditLogger, options.history);
  } else if (options.summary) {
    await handleAuditSummary(auditLogger);
  } else {
    console.log(chalk.yellow('Usage: mcp audit [--analyze] [--create-tasks] [--history <tool>] [--summary]'));
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

async function handleAuditAnalyze(projectPath: string): Promise<void> {
  const auditLogPath = path.join(projectPath, 'docs', 'audits', 'AUDIT_LOG.json');

  try {
    const analyzer = AuditAnalyzer.loadFromFile(auditLogPath);
    const summary = analyzer.getSummary();
    const trends = analyzer.analyzeTrends();
    const criticalIssues = analyzer.findCriticalIssues();
    const recommendations = analyzer.generateRecommendations();

    // Header
    console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold('📊 Audit Log Analysis'));
    console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Summary Statistics
    console.log(chalk.cyan.bold('📊 Summary Statistics\n'));
    console.log(chalk.bold(`Total audits: ${summary.totalAudits}`));
    console.log(chalk.dim(`Average duration: ${summary.avgDuration.toFixed(0)}ms\n`));

    if (Object.keys(summary.byTool).length > 0) {
      console.log(chalk.bold('By tool:'));
      Object.entries(summary.byTool).forEach(([tool, data]) => {
        const toolNames: Record<string, string> = {
          securityAudit: '🔒 Security',
          a11yAudit: '♿ Accessibility',
          techDebtCalculator: '💰 Technical Debt',
          analyzeComplexity: '🧮 Complexity',
        };
        const displayName = toolNames[tool] || tool;
        console.log(chalk.dim(`  ${displayName}: ${data.count} audits, average score ${data.avgScore.toFixed(1)}`));
      });
    }

    // Trends
    if (Object.values(trends).some(t => t.length > 0)) {
      console.log(chalk.cyan.bold('\n📈 Quality Trends\n'));

      const trendCategories: Record<string, string> = {
        security: '🔒 Security',
        a11y: '♿ Accessibility',
        techDebt: '💰 Technical Debt',
        complexity: '🧮 Complexity',
      };

      Object.entries(trends).forEach(([category, data]) => {
        if (data.length === 0) return;

        const displayName = trendCategories[category] || category;
        console.log(chalk.bold(displayName));

        const latest = data[data.length - 1];
        const previous = data[data.length - 2];

        if (previous) {
          const scoreDiff = latest.score - previous.score;
          const issuesDiff = (latest.issues || 0) - (previous.issues || 0);

          const scoreArrow = scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➡️';
          const issuesArrow = issuesDiff < 0 ? '✅' : issuesDiff > 0 ? '⚠️' : '➡️';

          console.log(chalk.dim(`  Latest: ${latest.score.toFixed(1)} ${scoreArrow} ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(1)}`));
          if (latest.issues !== undefined) {
            console.log(chalk.dim(`  Issues: ${latest.issues} ${issuesArrow} ${issuesDiff > 0 ? '+' : ''}${issuesDiff}`));
          }
          console.log(chalk.dim(`  Date: ${latest.timestamp.toLocaleDateString()}`));
        } else {
          console.log(chalk.dim(`  Score: ${latest.score.toFixed(1)}`));
          if (latest.issues !== undefined) {
            console.log(chalk.dim(`  Issues: ${latest.issues}`));
          }
        }
        console.log();
      });
    }

    // Critical Issues
    if (criticalIssues.length > 0) {
      console.log(chalk.red.bold(`\n🚨 Critical Issues (${criticalIssues.length})\n`));

      // Group by file
      const byFile: Record<string, typeof criticalIssues> = {};
      criticalIssues.forEach(issue => {
        const file = issue.file || 'unknown';
        if (!byFile[file]) byFile[file] = [];
        byFile[file].push(issue);
      });

      Object.entries(byFile).forEach(([file, fileIssues]) => {
        console.log(chalk.yellow(`📁 ${file}`));
        fileIssues.forEach(issue => {
          const severityColor = issue.severity === 'critical' ? chalk.red : chalk.yellow;
          console.log(severityColor(`  ${issue.severity.toUpperCase()}: ${issue.type}`));
          if (issue.line) console.log(chalk.dim(`    Line: ${issue.line}`));
          if (issue.risk) console.log(chalk.dim(`    Risk: ${issue.risk}`));
          if (issue.fix) console.log(chalk.green(`    Fix: ${issue.fix}`));
          console.log();
        });
      });
    } else {
      console.log(chalk.green('\n✅ No critical issues found!\n'));
    }

    // Recommendations
    if (recommendations.length > 0) {
      console.log(chalk.magenta.bold(`\n💡 Recommendations (${recommendations.length})\n`));

      const byPriority = {
        HIGH: [] as typeof recommendations,
        MEDIUM: [] as typeof recommendations,
        LOW: [] as typeof recommendations,
      };

      recommendations.forEach(rec => byPriority[rec.priority].push(rec));

      Object.entries(byPriority).forEach(([priority, recs]) => {
        if (recs.length === 0) return;

        const priorityColors: Record<string, any> = {
          HIGH: chalk.red,
          MEDIUM: chalk.yellow,
          LOW: chalk.dim,
        };

        const priorityNames: Record<string, string> = {
          HIGH: '🔴 High Priority',
          MEDIUM: '🟡 Medium Priority',
          LOW: '🟢 Low Priority',
        };

        console.log(priorityColors[priority].bold(priorityNames[priority]));

        recs.forEach(rec => {
          console.log(chalk.bold(`  ${rec.category}`));
          console.log(chalk.dim(`    Action: ${rec.action}`));
          console.log(chalk.dim(`    Impact: ${rec.impact}`));
          console.log();
        });
      });
    }

    // Footer
    console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Next Steps
    console.log(chalk.blue.bold('🚀 Next Steps:\n'));
    if (criticalIssues.length > 0) {
      console.log(chalk.yellow(`1. Fix ${criticalIssues.length} critical issue${criticalIssues.length > 1 ? 's' : ''}`));
      console.log(chalk.dim('   mcp audit create-tasks\n'));
    }
    console.log(chalk.dim('2. Run comprehensive audit:'));
    console.log(chalk.dim('   mcp mcp:security && mcp mcp:a11y && mcp mcp:tech-debt\n'));
    console.log(chalk.dim('3. View detailed trends:'));
    console.log(chalk.dim('   mcp audit trends\n'));

  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log(chalk.yellow('\n⚠️  Audit log is empty or not found.\n'));
      console.log(chalk.dim('Run some audits first:'));
      console.log(chalk.dim('  mcp mcp:security'));
      console.log(chalk.dim('  mcp mcp:a11y'));
      console.log(chalk.dim('  mcp mcp:tech-debt'));
      console.log(chalk.dim('  mcp mcp:complexity\n'));
    } else {
      console.error(chalk.red('Failed to analyze audit log:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

async function handleAuditCreateTasks(projectPath: string): Promise<void> {
  const auditLogPath = path.join(projectPath, 'docs', 'audits', 'AUDIT_LOG.json');
  const backlogPath = path.join(projectPath, 'docs', 'tasks', 'BACKLOG.json');

  try {
    console.log(chalk.cyan.bold('\n📋 Generating tasks from critical issues...\n'));

    // Load audit log and find critical issues
    const analyzer = AuditAnalyzer.loadFromFile(auditLogPath);
    const criticalIssues = analyzer.findCriticalIssues();

    if (criticalIssues.length === 0) {
      console.log(chalk.green('✅ No critical issues found! Nothing to create.\n'));
      return;
    }

    // Create task generator
    const taskGenerator = new TaskGenerator(backlogPath);

    // Generate tasks
    const newTasks = await taskGenerator.createTasksFromIssues(criticalIssues);

    // Display results
    console.log(chalk.green.bold(`✅ Created ${newTasks.length} task${newTasks.length > 1 ? 's' : ''}:\n`));

    newTasks.forEach(task => {
      const priorityColors: Record<string, any> = {
        critical: chalk.red,
        high: chalk.yellow,
        medium: chalk.blue,
        low: chalk.dim,
      };

      const priorityColor = priorityColors[task.priority] || chalk.white;
      console.log(priorityColor(`  ${task.id} [${task.priority.toUpperCase()}] ${task.title}`));

      if (task.relatedFiles.length > 0) {
        console.log(chalk.dim(`    File: ${task.relatedFiles[0]}`));
      }

      if (task.tags.length > 0) {
        console.log(chalk.dim(`    Tags: ${task.tags.map(t => `#${t}`).join(' ')}`));
      }

      console.log();
    });

    console.log(chalk.green(`💾 Saved to ${backlogPath.replace(projectPath, '.')}\n`));

    // Next steps
    console.log(chalk.blue.bold('🚀 Next steps:\n'));
    console.log(chalk.dim('1. Review tasks:'));
    console.log(chalk.dim('   mcp mcp:task-list\n'));
    console.log(chalk.dim('2. Start working on first task:'));
    console.log(chalk.dim('   mcp mcp:task-next\n'));

  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log(chalk.yellow('\n⚠️  Audit log not found.\n'));
      console.log(chalk.dim('Run audits first:'));
      console.log(chalk.dim('  mcp mcp:security'));
      console.log(chalk.dim('  mcp mcp:a11y\n'));
    } else {
      console.error(chalk.red('Failed to create tasks:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}
