import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { loadConfig } from '../lib/config.js';
import { TOOL_REGISTRY } from '../utils/tool-registry.js';
import * as tools from '../tools/index.js';
import { formatOutput } from './formatter.js';

export interface ExecuteOptions {
  path?: string;
  output?: string;
  json?: boolean;
  verbose?: boolean;
  noCache?: boolean;
  [key: string]: any;
}

export async function executeToolCommand(toolId: string, options: ExecuteOptions): Promise<void> {
  const spinner = ora();
  const startTime = Date.now();

  try {
    // Load configuration
    const projectPath = options.path ? path.resolve(options.path) : process.cwd();
    const config = await loadConfig(projectPath);

    // Get tool metadata
    const toolMeta = TOOL_REGISTRY[toolId];
    if (!toolMeta) {
      throw new Error(`Unknown tool: ${toolId}`);
    }

    // Show what we're doing
    if (!options.json) {
      console.log(chalk.cyan(`\n🔍 Running: ${toolMeta.name}`));
      console.log(chalk.dim(`   ${toolMeta.description}\n`));
      spinner.start(chalk.dim('Analyzing codebase...'));
    }

    // Get the tool function
    const toolFunction = (tools as any)[toolId];
    if (!toolFunction) {
      throw new Error(`Tool function not found: ${toolId}`);
    }

    // Prepare tool arguments
    const toolArgs: any = {
      projectPath,
      ...options
    };

    // Remove CLI-specific options
    delete toolArgs.path;
    delete toolArgs.output;
    delete toolArgs.json;
    delete toolArgs.verbose;
    delete toolArgs.config;

    // Execute tool
    const result = await toolFunction(toolArgs);
    const duration = Date.now() - startTime;

    spinner.succeed(chalk.green(`Analysis complete in ${duration}ms`));

    // Format and display output
    const formatted = formatOutput(result, {
      json: options.json || false,
      verbose: options.verbose || false,
      toolMeta
    });

    console.log(formatted);

    // Save to file if requested
    if (options.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(
        options.output,
        options.json ? JSON.stringify(result, null, 2) : formatted
      );
      console.log(chalk.dim(`\n💾 Saved to: ${options.output}`));
    }

    // Show token savings
    if (!options.json && result.metadata?.tokenSavings) {
      const savings = result.metadata.tokenSavings;
      console.log(chalk.cyan('\n📊 Token Savings:'));
      console.log(chalk.dim(`   Without MCP: ${savings.withoutMcp.toLocaleString()} tokens`));
      console.log(chalk.dim(`   With MCP: ${savings.withMcp.toLocaleString()} tokens`));
      console.log(chalk.green(`   Saved: ${savings.saved.toLocaleString()} tokens (${savings.percentage}%)`));
    }

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));

    if (error instanceof Error) {
      console.error(chalk.red('\n❌ Error:'), error.message);

      if (options.verbose && error.stack) {
        console.error(chalk.dim('\nStack trace:'));
        console.error(chalk.dim(error.stack));
      }
    }

    process.exit(1);
  }
}
