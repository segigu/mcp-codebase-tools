import chalk from 'chalk';

export interface FormatOptions {
  json: boolean;
  verbose: boolean;
  toolMeta?: any;
}

export function formatOutput(result: any, options: FormatOptions): string {
  if (options.json) {
    return JSON.stringify(result, null, 2);
  }

  // Format based on result structure
  if (result.summary) {
    return formatSummaryResult(result, options);
  } else if (Array.isArray(result)) {
    return formatArrayResult(result, options);
  } else if (typeof result === 'object') {
    return formatObjectResult(result, options);
  }

  return String(result);
}

function formatSummaryResult(result: any, options: FormatOptions): string {
  const lines: string[] = ['\n'];

  // Title
  if (result.summary.title || result.summary.score) {
    lines.push(chalk.bold.cyan('📊 Summary'));
    lines.push('');
  }

  // Score/Grade
  if (result.summary.score) {
    const score = result.summary.score;
    const grade = result.summary.grade || getGrade(parseInt(score));
    const color = getGradeColor(grade);

    lines.push(`   Score: ${color(score)} (Grade: ${color(grade)})`);
  }

  // Key metrics
  if (result.summary.metrics) {
    for (const [key, value] of Object.entries(result.summary.metrics)) {
      lines.push(`   ${formatKey(key)}: ${chalk.white(value)}`);
    }
  }

  // Issues
  if (result.issues && result.issues.length > 0) {
    lines.push('');
    lines.push(chalk.bold.yellow('⚠️  Issues'));
    lines.push('');

    const grouped = groupIssuesBySeverity(result.issues);

    for (const [severity, issues] of Object.entries(grouped)) {
      const icon = getSeverityIcon(severity);
      const color = getSeverityColor(severity);

      lines.push(color(`   ${icon} ${severity.toUpperCase()} (${issues.length})`));

      if (options.verbose) {
        issues.slice(0, 5).forEach((issue: any) => {
          lines.push(chalk.dim(`      • ${issue.message || issue.description}`));
          if (issue.file) {
            lines.push(chalk.dim(`        ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
          }
        });

        if (issues.length > 5) {
          lines.push(chalk.dim(`      ... and ${issues.length - 5} more`));
        }
      }
    }
  }

  // Details
  if (result.details && options.verbose) {
    lines.push('');
    lines.push(chalk.bold.cyan('📋 Details'));
    lines.push('');

    if (typeof result.details === 'object') {
      for (const [key, value] of Object.entries(result.details)) {
        if (Array.isArray(value)) {
          lines.push(`   ${formatKey(key)}: ${value.length} items`);
          if (options.verbose && value.length > 0 && value.length <= 10) {
            value.forEach((item: any) => {
              const itemStr = typeof item === 'string' ? item : item.name || item.id || JSON.stringify(item);
              lines.push(chalk.dim(`      • ${itemStr}`));
            });
          }
        } else {
          lines.push(`   ${formatKey(key)}: ${chalk.white(value)}`);
        }
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function formatArrayResult(result: any[], options: FormatOptions): string {
  const lines: string[] = ['\n'];

  lines.push(chalk.bold.cyan(`📋 Results (${result.length} items)`));
  lines.push('');

  const limit = options.verbose ? result.length : Math.min(result.length, 20);

  result.slice(0, limit).forEach((item, index) => {
    if (typeof item === 'string') {
      lines.push(`   ${chalk.dim(`${index + 1}.`)} ${item}`);
    } else if (item.file || item.path) {
      const file = item.file || item.path;
      const extra = item.line ? `:${item.line}` : '';
      lines.push(`   ${chalk.dim(`${index + 1}.`)} ${chalk.cyan(file)}${extra}`);

      if (item.message || item.description) {
        lines.push(chalk.dim(`      ${item.message || item.description}`));
      }
    } else if (item.name) {
      lines.push(`   ${chalk.dim(`${index + 1}.`)} ${chalk.green(item.name)}`);

      if (item.type) {
        lines.push(chalk.dim(`      Type: ${item.type}`));
      }
      if (item.complexity) {
        lines.push(chalk.dim(`      Complexity: ${item.complexity}`));
      }
    } else {
      lines.push(`   ${chalk.dim(`${index + 1}.`)} ${JSON.stringify(item)}`);
    }

    if (index < limit - 1) {
      lines.push('');
    }
  });

  if (result.length > limit) {
    lines.push('');
    lines.push(chalk.dim(`   ... and ${result.length - limit} more (use --verbose to see all)`));
  }

  lines.push('');
  return lines.join('\n');
}

function formatObjectResult(result: any, options: FormatOptions): string {
  const lines: string[] = ['\n'];

  lines.push(chalk.bold.cyan('📊 Result'));
  lines.push('');

  for (const [key, value] of Object.entries(result)) {
    if (key === 'metadata') continue; // Skip metadata

    if (Array.isArray(value)) {
      lines.push(`   ${formatKey(key)}: ${chalk.white(value.length)} items`);
      if (options.verbose && value.length > 0 && value.length <= 5) {
        value.forEach((item: any) => {
          const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
          lines.push(chalk.dim(`      • ${itemStr}`));
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`   ${formatKey(key)}:`);
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(chalk.dim(`      ${formatKey(subKey)}: ${subValue}`));
      }
    } else {
      lines.push(`   ${formatKey(key)}: ${chalk.white(value)}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// Helper functions

function formatKey(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getGradeColor(grade: string): typeof chalk.green {
  switch (grade) {
    case 'A': return chalk.green;
    case 'B': return chalk.cyan;
    case 'C': return chalk.yellow;
    case 'D': return chalk.magenta;
    default: return chalk.red;
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

function getSeverityColor(severity: string): typeof chalk.red {
  switch (severity.toLowerCase()) {
    case 'critical': return chalk.red;
    case 'high': return chalk.yellow;
    case 'medium': return chalk.cyan;
    case 'low': return chalk.dim;
    default: return chalk.white;
  }
}

function groupIssuesBySeverity(issues: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  issues.forEach(issue => {
    const severity = (issue.severity || 'low').toLowerCase();
    if (!grouped[severity]) {
      grouped[severity] = [];
    }
    grouped[severity].push(issue);
  });

  return Object.fromEntries(
    Object.entries(grouped).filter(([_, items]) => items.length > 0)
  );
}
