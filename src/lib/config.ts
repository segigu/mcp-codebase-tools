import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import { promises as fs } from 'fs';

export interface McpConfig {
  // Project settings
  projectRoot?: string;
  framework?: 'react' | 'vue' | 'angular' | 'svelte' | 'auto' | 'none';
  sourceDir: string;
  includePatterns: string[];
  excludePatterns: string[];

  // Cache settings
  cache: {
    enabled: boolean;
    ttl: {
      gitBased: number;    // seconds
      audits: number;      // seconds
      analysis: number;    // seconds
    };
  };

  // Tool-specific settings
  tools?: {
    security?: {
      enabled?: boolean;
      severity?: Array<'critical' | 'high' | 'medium' | 'low'>;
    };
    a11y?: {
      enabled?: boolean;
      wcagLevel?: 'A' | 'AA' | 'AAA';
    };
    complexity?: {
      threshold?: number;
    };
  };
}

export const DEFAULT_CONFIG: McpConfig = {
  framework: 'auto',
  sourceDir: 'src',
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  excludePatterns: ['node_modules', 'dist', 'build', '.next', 'out', 'coverage'],
  cache: {
    enabled: true,
    ttl: {
      gitBased: 300,      // 5 minutes
      audits: 1800,       // 30 minutes
      analysis: 7200      // 2 hours
    }
  },
  tools: {
    security: {
      enabled: true,
      severity: ['critical', 'high', 'medium', 'low']
    },
    a11y: {
      enabled: true,
      wcagLevel: 'AA'
    },
    complexity: {
      threshold: 10
    }
  }
};

const explorer = cosmiconfig('mcp', {
  searchPlaces: [
    'mcp.config.js',
    'mcp.config.cjs',
    'mcp.config.mjs',
    '.mcprc',
    '.mcprc.json',
    '.mcprc.yaml',
    '.mcprc.yml',
    'package.json'
  ]
});

export async function loadConfig(projectPath: string): Promise<McpConfig> {
  try {
    // Search for config file
    const result = await explorer.search(projectPath);

    let userConfig: Partial<McpConfig> = {};

    if (result && !result.isEmpty) {
      userConfig = result.config;
    }

    // Merge with defaults
    const config: McpConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      projectRoot: projectPath,
      cache: {
        ...DEFAULT_CONFIG.cache,
        ...userConfig.cache,
        ttl: {
          ...DEFAULT_CONFIG.cache.ttl,
          ...(userConfig.cache?.ttl || {})
        }
      },
      tools: {
        ...DEFAULT_CONFIG.tools,
        ...userConfig.tools
      }
    };

    // Validate config
    validateConfig(config);

    return config;

  } catch (error) {
    // If config not found or invalid, return defaults
    console.warn('Using default configuration');
    return {
      ...DEFAULT_CONFIG,
      projectRoot: projectPath
    };
  }
}

function validateConfig(config: McpConfig): void {
  // Validate sourceDir exists
  if (!config.sourceDir) {
    throw new Error('sourceDir is required in config');
  }

  // Validate framework
  const validFrameworks = ['react', 'vue', 'angular', 'svelte', 'auto', 'none'];
  if (config.framework && !validFrameworks.includes(config.framework)) {
    throw new Error(`Invalid framework: ${config.framework}. Must be one of: ${validFrameworks.join(', ')}`);
  }

  // Validate cache TTL values
  if (config.cache.enabled) {
    if (config.cache.ttl.gitBased < 0 || config.cache.ttl.audits < 0 || config.cache.ttl.analysis < 0) {
      throw new Error('Cache TTL values must be positive numbers');
    }
  }

  // Validate WCAG level
  if (config.tools?.a11y?.wcagLevel) {
    const validLevels = ['A', 'AA', 'AAA'];
    if (!validLevels.includes(config.tools.a11y.wcagLevel)) {
      throw new Error(`Invalid WCAG level: ${config.tools.a11y.wcagLevel}. Must be one of: ${validLevels.join(', ')}`);
    }
  }
}

export async function saveConfig(projectPath: string, config: Partial<McpConfig>): Promise<void> {
  const configPath = path.join(projectPath, 'mcp.config.js');

  const content = `// MCP Codebase Tools Configuration
// https://github.com/mcp-tools/codebase-tools

export default ${JSON.stringify(config, null, 2)};
`;

  await fs.writeFile(configPath, content, 'utf-8');
}
