#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { TOOL_REGISTRY } from '../utils/tool-registry.js';
import { executeToolCommand } from './executor.js';
import { initCommand } from './commands/init.js';
import { listCommand } from './commands/list.js';
import { cacheCommand } from './commands/cache.js';
import { auditCommand } from './commands/audit.js';
import { shouldShowReminder, getReminderMessage, markReminderShown } from '../utils/audit-status.js';

// Read package.json for version
const pkg = {
  name: '@mcp/codebase-tools',
  version: '1.0.0'
};

export class CLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  private setupProgram(): void {
    // Check for updates
    const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });
    if (notifier.update) {
      notifier.notify({
        message: `Update available ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\nRun ${chalk.cyan('npm install -g @mcp/codebase-tools')} to update`
      });
    }

    this.program
      .name('mcp')
      .description('MCP Codebase Analysis Tools - 90-98% token savings for AI code analysis')
      .version(pkg.version, '-v, --version', 'Output the current version')
      .option('--config <path>', 'Path to config file')
      .option('--verbose', 'Enable verbose logging')
      .option('--json', 'Output in JSON format')
      .option('--no-cache', 'Disable cache for this run')
      .helpOption('-h, --help', 'Display help for command');
  }

  private registerCommands(): void {
    // Special commands (not from tool registry)
    this.program
      .command('init')
      .description('Initialize MCP in current project')
      .option('-y, --yes', 'Skip interactive prompts and use defaults')
      .option('--framework <type>', 'Framework type (react|vue|angular|svelte|auto)')
      .action(initCommand);

    this.program
      .command('list')
      .description('List all available tools')
      .option('-c, --category <name>', 'Filter by category')
      .option('--verbose', 'Show detailed information')
      .action(listCommand);

    this.program
      .command('cache')
      .description('Manage cache')
      .option('--status', 'Show cache status')
      .option('--clear [tool]', 'Clear cache (all or specific tool)')
      .action(cacheCommand);

    this.program
      .command('audit')
      .description('Audit log analysis and management')
      .option('--and-fix', 'Comprehensive analysis and task creation (recommended)')
      .option('--analyze', 'Analyze audit log and show trends')
      .option('--create-tasks', 'Create tasks from critical issues')
      .option('--history <tool>', 'Show audit history for tool')
      .option('--summary', 'Show audit summary')
      .action(auditCommand);

    // Register all tools from registry as commands
    for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
      const cmd = this.program
        .command(tool.command)
        .description(tool.description);

      // Add tool-specific options
      // @ts-ignore - schema might not exist in all tools
      if (tool.schema?.properties) {
        // @ts-ignore
        for (const [propName, propSchema] of Object.entries(tool.schema.properties)) {
          const prop = propSchema as any;
          if (propName === 'projectPath') continue; // Auto-detected

          const optionFlag = `--${propName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          const optionDesc = prop.description || propName;

          if (prop.type === 'boolean') {
            cmd.option(optionFlag, optionDesc);
          } else if (prop.type === 'string') {
            cmd.option(`${optionFlag} <value>`, optionDesc);
          } else if (prop.type === 'number') {
            cmd.option(`${optionFlag} <number>`, optionDesc);
          }
        }
      }

      // Add common options
      cmd.option('--path <dir>', 'Project path (default: current directory)')
         .option('--output <file>', 'Save output to file')
         .action(async (options) => {
           await executeToolCommand(toolId, options);
         });
    }

    // Help command
    this.program
      .command('help [command]')
      .description('Display help for a specific command')
      .action((command?: string) => {
        if (command) {
          const targetCommand = this.program.commands.find(cmd => cmd.name() === command);
          if (targetCommand) {
            targetCommand.help();
          } else {
            console.log(chalk.red(`Unknown command: ${command}`));
            this.program.help();
          }
        } else {
          this.program.help();
        }
      });
  }

  public async run(argv: string[]): Promise<void> {
    try {
      // Show audit reminder before running command (if applicable)
      this.showAuditReminder();

      await this.program.parseAsync(argv);
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message);
        if ((this.program.opts() as any).verbose) {
          console.error(chalk.dim(error.stack));
        }
      }
      process.exit(1);
    }
  }

  private showAuditReminder(): void {
    const projectPath = process.cwd();

    // Check if we should show reminder
    if (!shouldShowReminder(projectPath)) {
      return;
    }

    const message = getReminderMessage(projectPath);
    if (!message) {
      return;
    }

    // Show reminder banner
    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(message);
    console.log(chalk.dim('\n💡 Quick fix: mcp audit --and-fix'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Mark reminder as shown
    markReminderShown(projectPath);
  }

  public static async run(argv: string[]): Promise<void> {
    const cli = new CLI();
    await cli.run(argv);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  CLI.run(process.argv);
}
