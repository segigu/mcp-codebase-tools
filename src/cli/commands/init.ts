import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { promises as fs } from 'fs';
import { detectFramework, findProjectRoot } from '../../lib/project-detector.js';

export interface InitOptions {
  yes?: boolean;
  framework?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.cyan.bold('\n🚀 Initialize MCP Codebase Tools\n'));

  try {
    // Find project root
    const projectRoot = await findProjectRoot(process.cwd());
    console.log(chalk.dim(`Project root: ${projectRoot}\n`));

    // Detect framework
    const detectedFramework = await detectFramework(projectRoot);
    console.log(chalk.dim(`Detected framework: ${detectedFramework || 'unknown'}\n`));

    let config: any;

    if (options.yes) {
      // Use defaults
      config = {
        framework: options.framework || detectedFramework || 'auto',
        sourceDir: 'src',
        includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        excludePatterns: ['node_modules', 'dist', 'build', '.next', 'out'],
        cache: {
          enabled: true,
          ttl: {
            gitBased: 300,
            audits: 1800,
            analysis: 7200
          }
        }
      };
    } else {
      // Interactive prompts
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'framework',
          message: 'Select your framework:',
          default: options.framework || detectedFramework || 'react',
          choices: [
            { name: 'React', value: 'react' },
            { name: 'Vue', value: 'vue' },
            { name: 'Angular', value: 'angular' },
            { name: 'Svelte', value: 'svelte' },
            { name: 'Auto-detect', value: 'auto' },
            { name: 'None / Vanilla JS', value: 'none' }
          ]
        },
        {
          type: 'input',
          name: 'sourceDir',
          message: 'Source directory:',
          default: 'src'
        },
        {
          type: 'confirm',
          name: 'enableCache',
          message: 'Enable caching?',
          default: true
        },
        {
          type: 'confirm',
          name: 'createConfig',
          message: 'Create mcp.config.js file?',
          default: true
        }
      ]);

      config = {
        framework: answers.framework,
        sourceDir: answers.sourceDir,
        includePatterns: getDefaultPatterns(answers.framework),
        excludePatterns: ['node_modules', 'dist', 'build', '.next', 'out'],
        cache: {
          enabled: answers.enableCache,
          ttl: {
            gitBased: 300,
            audits: 1800,
            analysis: 7200
          }
        }
      };

      // Write config file
      if (answers.createConfig) {
        await writeConfigFile(projectRoot, config);
        console.log(chalk.green('\n✓ Created mcp.config.js'));
      }
    }

    // Summary
    console.log(chalk.cyan('\n📋 Configuration Summary:'));
    console.log(chalk.dim(`   Framework: ${config.framework}`));
    console.log(chalk.dim(`   Source Dir: ${config.sourceDir}`));
    console.log(chalk.dim(`   Cache: ${config.cache.enabled ? 'enabled' : 'disabled'}`));

    // Next steps
    console.log(chalk.cyan('\n🎯 Next Steps:'));
    console.log(chalk.dim('   1. Run your first audit:'));
    console.log(chalk.white('      mcp security-audit'));
    console.log(chalk.dim('\n   2. Find where a component is used:'));
    console.log(chalk.white('      mcp find-imports <ComponentName>'));
    console.log(chalk.dim('\n   3. List all available commands:'));
    console.log(chalk.white('      mcp list'));
    console.log(chalk.dim('\n   4. Get help:'));
    console.log(chalk.white('      mcp --help\n'));

  } catch (error) {
    console.error(chalk.red('Initialization failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function getDefaultPatterns(framework: string): string[] {
  const base = ['**/*.ts', '**/*.js'];

  switch (framework) {
    case 'react':
      return [...base, '**/*.tsx', '**/*.jsx'];
    case 'vue':
      return [...base, '**/*.vue'];
    case 'angular':
      return [...base, '**/*.component.ts', '**/*.service.ts'];
    case 'svelte':
      return [...base, '**/*.svelte'];
    default:
      return [...base, '**/*.tsx', '**/*.jsx'];
  }
}

async function writeConfigFile(projectRoot: string, config: any): Promise<void> {
  const configPath = path.join(projectRoot, 'mcp.config.js');

  const content = `// MCP Codebase Tools Configuration
// https://github.com/mcp-tools/codebase-tools

export default ${JSON.stringify(config, null, 2)};
`;

  await fs.writeFile(configPath, content, 'utf-8');
}
