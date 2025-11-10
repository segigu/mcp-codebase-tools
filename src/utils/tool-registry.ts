/**
 * Tool Registry - Central metadata for all 27 MCP tools
 *
 * Provides metadata about all available tools organized by category.
 */

import {
  type ToolMetadata,
  type ToolCategory,
  type DetailLevel,
  type ToolListItem,
  type ToolDescription,
  type ToolSchema,
  type ToolRegistryOutput,
  type ToolSearchOptions
} from './tool-metadata.js'

/**
 * Complete registry of all 27 tools
 */
export const TOOL_REGISTRY: Record<string, ToolMetadata> = {
  // ===== AUDIT TOOLS (11) =====

  securityAudit: {
    id: 'securityAudit',
    name: 'Security Audit',
    description: 'Find security vulnerabilities (XSS, hardcoded secrets, etc.)',
    longDescription: 'Scans codebase for common security issues like XSS vulnerabilities, hardcoded API keys, and unsafe patterns. Provides severity ratings and fix suggestions.',
    category: 'audit',
    tags: ['security', 'xss', 'secrets', 'vulnerabilities'],
    complexity: 'moderate',
    command: 'mcp:security-audit',
    npmScript: 'mcp:security-audit',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'SecurityAuditInput',
    outputType: 'SecurityAuditOutput',
    estimatedTokenUsage: { min: 500, avg: 2000, max: 8000 },
    estimatedDuration: { min: 100, avg: 500, max: 2000 },
    examples: [
      {
        title: 'Full security scan',
        command: 'npm run mcp:security-audit',
        description: 'Scan entire codebase for security vulnerabilities',
        expectedOutput: 'Score, vulnerabilities by severity (critical/high/medium/low)'
      },
      {
        title: 'Filter critical only',
        command: 'npm run mcp:security-audit -- --severity critical',
        description: 'Show only critical security issues',
        expectedOutput: 'Filtered list of critical vulnerabilities'
      }
    ]
  },

  a11yAudit: {
    id: 'a11yAudit',
    name: 'Accessibility Audit',
    description: 'Find accessibility issues (missing alt, labels, ARIA)',
    longDescription: 'Analyzes React/JSX code for accessibility violations like missing alt text, missing labels, and ARIA issues. Provides WCAG compliance guidance.',
    category: 'audit',
    tags: ['a11y', 'accessibility', 'wcag', 'aria', 'react'],
    complexity: 'moderate',
    command: 'mcp:a11y-audit',
    npmScript: 'mcp:a11y-audit',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'A11yAuditInput',
    outputType: 'A11yAuditOutput',
    estimatedTokenUsage: { min: 400, avg: 1800, max: 6000 },
    estimatedDuration: { min: 100, avg: 400, max: 1500 },
    examples: [
      {
        title: 'Full a11y audit',
        command: 'npm run mcp:a11y-audit',
        description: 'Check all components for accessibility issues',
        expectedOutput: 'Score, issues by severity with fix suggestions'
      }
    ]
  },

  techDebtCalculator: {
    id: 'techDebtCalculator',
    name: 'Tech Debt Calculator',
    description: 'Calculate technical debt (TODOs, deprecated APIs)',
    longDescription: 'Analyzes codebase for tech debt indicators: TODOs, FIXMEs, HACKs, and deprecated API usage. Provides debt score and prioritization.',
    category: 'audit',
    tags: ['tech-debt', 'todos', 'deprecated', 'quality'],
    complexity: 'simple',
    command: 'mcp:tech-debt',
    npmScript: 'mcp:tech-debt',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'TechDebtInput',
    outputType: 'TechDebtOutput',
    estimatedTokenUsage: { min: 300, avg: 1200, max: 4000 },
    estimatedDuration: { min: 80, avg: 300, max: 1000 },
    examples: [
      {
        title: 'Calculate tech debt',
        command: 'npm run mcp:tech-debt',
        description: 'Analyze all TODOs, FIXMEs, and deprecated code',
        expectedOutput: 'Debt score, todos by priority, deprecated APIs'
      }
    ]
  },

  testCoverageGaps: {
    id: 'testCoverageGaps',
    name: 'Test Coverage Gaps',
    description: 'Find untested components and functions',
    longDescription: 'Identifies components and functions without test files, suggests test cases, and detects missing edge case coverage.',
    category: 'audit',
    tags: ['testing', 'coverage', 'quality', 'tdd'],
    complexity: 'complex',
    command: 'mcp:test-coverage-gaps',
    npmScript: 'mcp:test-coverage-gaps',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'TestCoverageGapsInput',
    outputType: 'TestCoverageGapsOutput',
    estimatedTokenUsage: { min: 1000, avg: 5000, max: 15000 },
    estimatedDuration: { min: 200, avg: 1000, max: 3000 },
    examples: [
      {
        title: 'Find untested code',
        command: 'npm run mcp:test-coverage-gaps',
        description: 'List all components/functions without tests',
        expectedOutput: 'Uncovered items with suggested test cases'
      }
    ]
  },

  i18nAnalysis: {
    id: 'i18nAnalysis',
    name: 'i18n Analysis',
    description: 'Analyze localization coverage and missing keys',
    longDescription: 'Scans translation files and code to find missing translations, unused keys, and calculate coverage percentage per locale.',
    category: 'audit',
    tags: ['i18n', 'localization', 'translations', 'l10n'],
    complexity: 'moderate',
    command: 'mcp:i18n',
    npmScript: 'mcp:i18n',
    supportsPagination: true,
    supportsFiltering: false,
    hasAuditLogging: true,
    inputType: 'I18nAnalysisInput',
    outputType: 'I18nAnalysisOutput',
    estimatedTokenUsage: { min: 800, avg: 3000, max: 10000 },
    estimatedDuration: { min: 150, avg: 600, max: 2000 },
    examples: [
      {
        title: 'Check i18n coverage',
        command: 'npm run mcp:i18n',
        description: 'Analyze translation coverage for all locales',
        expectedOutput: 'Missing keys, unused keys, coverage per locale'
      }
    ]
  },

  analyzeUnusedExports: {
    id: 'analyzeUnusedExports',
    name: 'Unused Exports',
    description: 'Find exported code never imported anywhere',
    longDescription: 'Analyzes all exports and imports across the codebase to identify dead code that is exported but never used.',
    category: 'audit',
    tags: ['dead-code', 'exports', 'imports', 'cleanup'],
    complexity: 'complex',
    command: 'mcp:unused',
    npmScript: 'mcp:unused',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: true,
    inputType: 'AnalyzeUnusedExportsInput',
    outputType: 'AnalyzeUnusedExportsOutput',
    estimatedTokenUsage: { min: 600, avg: 2500, max: 8000 },
    estimatedDuration: { min: 200, avg: 800, max: 2500 },
    examples: [
      {
        title: 'Find unused exports',
        command: 'npm run mcp:unused',
        description: 'List all exported code that is never imported',
        expectedOutput: 'Unused exports with file locations and percentages'
      }
    ]
  },

  analyzeComplexity: {
    id: 'analyzeComplexity',
    name: 'Complexity Analysis',
    description: 'Calculate cyclomatic complexity of functions',
    longDescription: 'Computes cyclomatic complexity metrics for all functions, identifies overly complex code, and provides refactoring suggestions.',
    category: 'audit',
    tags: ['complexity', 'cyclomatic', 'quality', 'refactoring'],
    complexity: 'moderate',
    command: 'mcp:complexity',
    npmScript: 'mcp:complexity',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: true,
    inputType: 'AnalyzeComplexityInput',
    outputType: 'AnalyzeComplexityOutput',
    estimatedTokenUsage: { min: 500, avg: 2000, max: 7000 },
    estimatedDuration: { min: 150, avg: 700, max: 2000 },
    examples: [
      {
        title: 'Analyze complexity',
        command: 'npm run mcp:complexity',
        description: 'Calculate complexity for all functions',
        expectedOutput: 'Average complexity, files with high complexity scores'
      }
    ]
  },

  gitHotspots: {
    id: 'gitHotspots',
    name: 'Git Hotspots',
    description: 'Find files changed most frequently (git log analysis)',
    longDescription: 'Analyzes git history to identify frequently changed files, commit patterns, and areas with high churn that may need refactoring.',
    category: 'audit',
    tags: ['git', 'history', 'churn', 'hotspots'],
    complexity: 'simple',
    command: 'mcp:git-hotspots',
    npmScript: 'mcp:git-hotspots',
    supportsPagination: true,
    supportsFiltering: false,
    hasAuditLogging: true,
    inputType: 'GitHotspotsInput',
    outputType: 'GitHotspotsOutput',
    estimatedTokenUsage: { min: 200, avg: 800, max: 2500 },
    estimatedDuration: { min: 300, avg: 1000, max: 3000 },
    examples: [
      {
        title: 'Find hotspots',
        command: 'npm run mcp:git-hotspots',
        description: 'Show files with most commits (high churn)',
        expectedOutput: 'Files with commit counts, risk levels, and patterns'
      }
    ]
  },

  bundleAnalysis: {
    id: 'bundleAnalysis',
    name: 'Bundle Analysis',
    description: 'Analyze bundle size and suggest optimizations',
    longDescription: 'Estimates bundle size by analyzing imports, identifies heavy dependencies, and suggests optimization opportunities.',
    category: 'audit',
    tags: ['bundle', 'size', 'optimization', 'performance'],
    complexity: 'moderate',
    command: 'mcp:bundle-analysis',
    npmScript: 'mcp:bundle-analysis',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'BundleAnalysisInput',
    outputType: 'BundleAnalysisOutput',
    estimatedTokenUsage: { min: 400, avg: 1600, max: 5000 },
    estimatedDuration: { min: 100, avg: 500, max: 1500 },
    examples: [
      {
        title: 'Analyze bundle',
        command: 'npm run mcp:bundle-analysis',
        description: 'Estimate bundle size and find heavy modules',
        expectedOutput: 'Heaviest modules, total size, optimization potential'
      }
    ]
  },

  stateManagementAnalysis: {
    id: 'stateManagementAnalysis',
    name: 'State Management Analysis',
    description: 'Analyze React state usage patterns',
    longDescription: 'Examines React state management patterns (useState, useContext, etc.), finds unused state, and detects potential optimization opportunities.',
    category: 'audit',
    tags: ['react', 'state', 'hooks', 'performance'],
    complexity: 'moderate',
    command: 'mcp:state-management',
    npmScript: 'mcp:state-management',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'StateManagementInput',
    outputType: 'StateManagementOutput',
    estimatedTokenUsage: { min: 300, avg: 1200, max: 4000 },
    estimatedDuration: { min: 80, avg: 400, max: 1200 },
    examples: [
      {
        title: 'Analyze state',
        command: 'npm run mcp:state-management',
        description: 'Check state management patterns and unused state',
        expectedOutput: 'State usage patterns, unused state variables'
      }
    ]
  },

  rerendersDetection: {
    id: 'rerendersDetection',
    name: 'Rerenders Detection',
    description: 'Find potential unnecessary React re-renders',
    longDescription: 'Detects patterns that cause unnecessary re-renders in React: inline arrow functions, missing dependencies, and memoization opportunities.',
    category: 'audit',
    tags: ['react', 'performance', 'rerenders', 'memoization'],
    complexity: 'moderate',
    command: 'mcp:rerenders-detection',
    npmScript: 'mcp:rerenders-detection',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: true,
    inputType: 'RerendersDetectionInput',
    outputType: 'RerendersDetectionOutput',
    estimatedTokenUsage: { min: 300, avg: 1000, max: 3500 },
    estimatedDuration: { min: 80, avg: 350, max: 1000 },
    examples: [
      {
        title: 'Find rerender issues',
        command: 'npm run mcp:rerenders-detection',
        description: 'Detect patterns causing unnecessary re-renders',
        expectedOutput: 'Issues with inline functions, missing deps, suggestions'
      }
    ]
  },

  // ===== NAVIGATE TOOLS (3) =====

  callersAnalysis: {
    id: 'callersAnalysis',
    name: 'Callers Analysis',
    description: 'Find all places where a function/component is called',
    longDescription: 'Reverse lookup: finds all locations where a given function or component is imported and called/used in the codebase.',
    category: 'navigate',
    tags: ['callers', 'reverse-lookup', 'references', 'usage'],
    complexity: 'moderate',
    command: 'mcp:callers',
    npmScript: 'mcp:callers',
    supportsPagination: true,
    supportsFiltering: true,
    hasAuditLogging: false,
    inputType: 'CallersAnalysisInput',
    outputType: 'CallersAnalysisOutput',
    estimatedTokenUsage: { min: 300, avg: 1200, max: 4000 },
    estimatedDuration: { min: 100, avg: 500, max: 1500 },
    examples: [
      {
        title: 'Find callers',
        command: 'npm run mcp:callers -- Button',
        description: 'Find all places where Button component is used',
        expectedOutput: 'List of files and lines where Button is called'
      }
    ]
  },

  findImports: {
    id: 'findImports',
    name: 'Find Imports',
    description: 'Find all files that import a specific module',
    longDescription: 'Searches codebase for all import statements of a specific module or component. Useful for impact analysis.',
    category: 'navigate',
    tags: ['imports', 'dependencies', 'search'],
    complexity: 'simple',
    command: 'mcp:find-imports',
    npmScript: 'mcp:find-imports',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'FindImportsInput',
    outputType: 'FindImportsOutput',
    estimatedTokenUsage: { min: 200, avg: 800, max: 2500 },
    estimatedDuration: { min: 50, avg: 250, max: 800 },
    examples: [
      {
        title: 'Find imports',
        command: 'npm run mcp:find-imports -- useState',
        description: 'Find all files importing useState hook',
        expectedOutput: 'List of files with import statements'
      }
    ]
  },

  findUsages: {
    id: 'findUsages',
    name: 'Find Usages',
    description: 'Find all usages of a symbol (function, variable, hook)',
    longDescription: 'Searches for all occurrences of a given symbol (variable, function, class, hook) throughout the codebase.',
    category: 'navigate',
    tags: ['usages', 'references', 'search', 'symbols'],
    complexity: 'simple',
    command: 'mcp:find-usages',
    npmScript: 'mcp:find-usages',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'FindUsagesInput',
    outputType: 'FindUsagesOutput',
    estimatedTokenUsage: { min: 200, avg: 700, max: 2200 },
    estimatedDuration: { min: 50, avg: 200, max: 700 },
    examples: [
      {
        title: 'Find usages',
        command: 'npm run mcp:find-usages -- useAuth',
        description: 'Find all places where useAuth hook is used',
        expectedOutput: 'List of files and lines with useAuth calls'
      }
    ]
  },

  // ===== SEARCH TOOLS (8) =====

  findComponents: {
    id: 'findComponents',
    name: 'Find Components',
    description: 'List all React components in the project',
    longDescription: 'Extracts all React component definitions from .tsx/.jsx files, including function and class components.',
    category: 'search',
    tags: ['react', 'components', 'inventory'],
    complexity: 'simple',
    command: 'mcp:find-components',
    npmScript: 'mcp:find-components',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'FindComponentsInput',
    outputType: 'FindComponentsOutput',
    estimatedTokenUsage: { min: 300, avg: 1200, max: 4000 },
    estimatedDuration: { min: 100, avg: 500, max: 1500 },
    examples: [
      {
        title: 'List components',
        command: 'npm run mcp:find-components',
        description: 'Show all React components in the project',
        expectedOutput: 'List of components with file locations'
      }
    ]
  },

  codeStructure: {
    id: 'codeStructure',
    name: 'Code Structure',
    description: 'Analyze project structure and architecture',
    longDescription: 'Provides high-level overview of project structure: file counts, directory organization, module dependencies.',
    category: 'search',
    tags: ['structure', 'architecture', 'overview'],
    complexity: 'simple',
    command: 'mcp:structure',
    npmScript: 'mcp:structure',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'CodeStructureInput',
    outputType: 'CodeStructureOutput',
    estimatedTokenUsage: { min: 400, avg: 1500, max: 5000 },
    estimatedDuration: { min: 150, avg: 600, max: 2000 },
    examples: [
      {
        title: 'Show structure',
        command: 'npm run mcp:structure',
        description: 'Display project structure and organization',
        expectedOutput: 'Directory tree, file counts, module dependencies'
      }
    ]
  },

  componentInventory: {
    id: 'componentInventory',
    name: 'Component Inventory',
    description: 'Generate inventory of all components with props and usage',
    longDescription: 'Creates comprehensive inventory of React components including props, state usage, and where they are used.',
    category: 'search',
    tags: ['react', 'components', 'inventory', 'documentation'],
    complexity: 'complex',
    command: 'mcp:component-inventory',
    npmScript: 'mcp:component-inventory',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'ComponentInventoryInput',
    outputType: 'ComponentInventoryOutput',
    estimatedTokenUsage: { min: 1000, avg: 4000, max: 12000 },
    estimatedDuration: { min: 200, avg: 1000, max: 3000 },
    examples: [
      {
        title: 'Component inventory',
        command: 'npm run mcp:component-inventory',
        description: 'Generate full component inventory with props',
        expectedOutput: 'Component details, props, usage locations'
      }
    ]
  },

  designTokens: {
    id: 'designTokens',
    name: 'Design Tokens',
    description: 'Extract design tokens (colors, spacing, typography)',
    longDescription: 'Analyzes CSS/Tailwind configuration to extract design tokens: colors, spacing scale, typography, and other design system values.',
    category: 'search',
    tags: ['design-system', 'tokens', 'tailwind', 'css'],
    complexity: 'moderate',
    command: 'mcp:design-tokens',
    npmScript: 'mcp:design-tokens',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'DesignTokensInput',
    outputType: 'DesignTokensOutput',
    estimatedTokenUsage: { min: 300, avg: 1000, max: 3000 },
    estimatedDuration: { min: 100, avg: 400, max: 1200 },
    examples: [
      {
        title: 'Extract tokens',
        command: 'npm run mcp:design-tokens',
        description: 'Show all design tokens from Tailwind config',
        expectedOutput: 'Colors, spacing, typography tokens'
      }
    ]
  },

  apiInventory: {
    id: 'apiInventory',
    name: 'API Inventory',
    description: 'List all API endpoints and their usage',
    longDescription: 'Scans code for API calls (axios, fetch) and generates inventory of endpoints, methods, and where they are called.',
    category: 'search',
    tags: ['api', 'endpoints', 'http', 'inventory'],
    complexity: 'complex',
    command: 'mcp:api-inventory',
    npmScript: 'mcp:api-inventory',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'ApiInventoryInput',
    outputType: 'ApiInventoryOutput',
    estimatedTokenUsage: { min: 500, avg: 2000, max: 6000 },
    estimatedDuration: { min: 150, avg: 700, max: 2000 },
    examples: [
      {
        title: 'API inventory',
        command: 'npm run mcp:api-inventory',
        description: 'List all API endpoints used in the app',
        expectedOutput: 'Endpoints, methods, usage locations'
      }
    ]
  },

  tailwindOptimizer: {
    id: 'tailwindOptimizer',
    name: 'Tailwind Optimizer',
    description: 'Find unused Tailwind classes and suggest optimizations',
    longDescription: 'Analyzes Tailwind usage to find unused classes, duplicate patterns, and opportunities for @apply directives.',
    category: 'search',
    tags: ['tailwind', 'css', 'optimization', 'unused'],
    complexity: 'moderate',
    command: 'mcp:tailwind-optimizer',
    npmScript: 'mcp:tailwind-optimizer',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'TailwindOptimizerInput',
    outputType: 'TailwindOptimizerOutput',
    estimatedTokenUsage: { min: 400, avg: 1500, max: 5000 },
    estimatedDuration: { min: 120, avg: 600, max: 1800 },
    examples: [
      {
        title: 'Optimize Tailwind',
        command: 'npm run mcp:tailwind-optimizer',
        description: 'Find unused classes and optimization opportunities',
        expectedOutput: 'Unused classes, duplicate patterns, @apply suggestions'
      }
    ]
  },

  mockGenerator: {
    id: 'mockGenerator',
    name: 'Mock Generator',
    description: 'Generate mock data for components and tests',
    longDescription: 'Creates realistic mock data based on TypeScript interfaces and component props for testing purposes.',
    category: 'search',
    tags: ['testing', 'mocks', 'data', 'generator'],
    complexity: 'moderate',
    command: 'mcp:mock-generator',
    npmScript: 'mcp:mock-generator',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'MockGeneratorInput',
    outputType: 'MockGeneratorOutput',
    estimatedTokenUsage: { min: 300, avg: 1200, max: 4000 },
    estimatedDuration: { min: 100, avg: 500, max: 1500 },
    examples: [
      {
        title: 'Generate mocks',
        command: 'npm run mcp:mock-generator -- UserProfile',
        description: 'Generate mock data for UserProfile component',
        expectedOutput: 'Mock data matching component props'
      }
    ]
  },

  docsGenerator: {
    id: 'docsGenerator',
    name: 'Docs Generator',
    description: 'Generate documentation from code comments and types',
    longDescription: 'Extracts JSDoc comments, TypeScript types, and component props to generate markdown documentation automatically.',
    category: 'search',
    tags: ['documentation', 'jsdoc', 'markdown', 'generator'],
    complexity: 'complex',
    command: 'mcp:docs-generator',
    npmScript: 'mcp:docs-generator',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'DocsGeneratorInput',
    outputType: 'DocsGeneratorOutput',
    estimatedTokenUsage: { min: 500, avg: 2000, max: 7000 },
    estimatedDuration: { min: 150, avg: 800, max: 2500 },
    examples: [
      {
        title: 'Generate docs',
        command: 'npm run mcp:docs-generator',
        description: 'Generate markdown docs from code',
        expectedOutput: 'Markdown files with API documentation'
      }
    ]
  },

  // ===== UTILITY TOOLS (5) =====

  auditHistory: {
    id: 'auditHistory',
    name: 'Audit History',
    description: 'Show history of audit results with trends',
    longDescription: 'Displays historical audit results for a specific tool, showing trends over time (improvements/regressions).',
    category: 'utility',
    tags: ['audit', 'history', 'trends', 'logging'],
    complexity: 'simple',
    command: 'mcp:audit-history',
    npmScript: 'mcp:audit-history',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'string',
    outputType: 'AuditLogEntry[]',
    estimatedTokenUsage: { min: 100, avg: 400, max: 1500 },
    estimatedDuration: { min: 20, avg: 100, max: 300 },
    examples: [
      {
        title: 'Show audit history',
        command: 'npm run mcp:audit-history securityAudit',
        description: 'Display last 10 security audits with trends',
        expectedOutput: 'Audit results with improvements/regressions'
      }
    ]
  },

  auditSummary: {
    id: 'auditSummary',
    name: 'Audit Summary',
    description: 'Show summary of all audits (recent improvements/regressions)',
    longDescription: 'Provides overview of all audit tools: total audits run, recent improvements, and areas with regressions.',
    category: 'utility',
    tags: ['audit', 'summary', 'overview', 'dashboard'],
    complexity: 'simple',
    command: 'mcp:audit-summary',
    npmScript: 'mcp:audit-summary',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'void',
    outputType: 'AuditSummary',
    estimatedTokenUsage: { min: 100, avg: 300, max: 1000 },
    estimatedDuration: { min: 20, avg: 80, max: 250 },
    examples: [
      {
        title: 'Audit summary',
        command: 'npm run mcp:audit-summary',
        description: 'Show overview of all audits',
        expectedOutput: 'Total audits, improvements, regressions by tool'
      }
    ]
  },

  help: {
    id: 'help',
    name: 'Help',
    description: 'Show help for MCP tools and commands',
    longDescription: 'Displays comprehensive help information about available MCP tools, usage examples, and common workflows.',
    category: 'utility',
    tags: ['help', 'documentation', 'guide'],
    complexity: 'simple',
    command: 'mcp:help',
    npmScript: 'mcp:help',
    supportsPagination: false,
    supportsFiltering: false,
    hasAuditLogging: false,
    inputType: 'string',
    outputType: 'string',
    estimatedTokenUsage: { min: 50, avg: 200, max: 800 },
    estimatedDuration: { min: 10, avg: 50, max: 150 },
    examples: [
      {
        title: 'Show help',
        command: 'npm run mcp:help',
        description: 'Display help for all tools',
        expectedOutput: 'List of commands with descriptions'
      },
      {
        title: 'Tool-specific help',
        command: 'npm run mcp:help security-audit',
        description: 'Show help for security audit tool',
        expectedOutput: 'Detailed help for security audit'
      }
    ]
  }
}

/**
 * Get tool metadata by ID
 */
export function getToolMetadata(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY[id]
}

/**
 * Get all tools as list (minimal detail)
 */
export function getToolList(options?: ToolSearchOptions): ToolListItem[] {
  const tools = Object.values(TOOL_REGISTRY)
  const filtered = filterTools(tools, options)

  return filtered.map(tool => ({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    npmScript: tool.npmScript
  }))
}

/**
 * Get all tools with descriptions (medium detail)
 */
export function getToolDescriptions(options?: ToolSearchOptions): ToolDescription[] {
  const tools = Object.values(TOOL_REGISTRY)
  const filtered = filterTools(tools, options)

  return filtered.map(tool => ({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    npmScript: tool.npmScript,
    description: tool.description,
    tags: tool.tags,
    complexity: tool.complexity,
    supportsPagination: tool.supportsPagination,
    supportsFiltering: tool.supportsFiltering
  }))
}

/**
 * Get all tools with full schemas (maximum detail)
 */
export function getToolSchemas(options?: ToolSearchOptions): ToolSchema[] {
  const tools = Object.values(TOOL_REGISTRY)
  const filtered = filterTools(tools, options)

  return filtered.map(tool => ({
    id: tool.id,
    name: tool.name,
    category: tool.category,
    npmScript: tool.npmScript,
    description: tool.description,
    tags: tool.tags,
    complexity: tool.complexity,
    supportsPagination: tool.supportsPagination,
    supportsFiltering: tool.supportsFiltering,
    longDescription: tool.longDescription,
    command: tool.command,
    examples: tool.examples,
    inputType: tool.inputType,
    outputType: tool.outputType,
    dependencies: tool.dependencies,
    estimatedTokenUsage: tool.estimatedTokenUsage,
    estimatedDuration: tool.estimatedDuration,
    hasAuditLogging: tool.hasAuditLogging
  }))
}

/**
 * Get tools formatted for specified detail level
 */
export function getTools(level: DetailLevel, options?: ToolSearchOptions): ToolRegistryOutput {
  let tools: ToolListItem[] | ToolDescription[] | ToolSchema[]

  switch (level) {
    case 'list':
      tools = getToolList(options)
      break
    case 'describe':
      tools = getToolDescriptions(options)
      break
    case 'schema':
      tools = getToolSchemas(options)
      break
  }

  // Calculate category counts
  const allTools = Object.values(TOOL_REGISTRY)
  const filtered = filterTools(allTools, options)
  const categories: Record<ToolCategory, number> = {
    analyze: 0,
    navigate: 0,
    search: 0,
    transform: 0,
    audit: 0,
    utility: 0
  }

  for (const tool of filtered) {
    categories[tool.category]++
  }

  return {
    level,
    totalTools: tools.length,
    categories,
    tools
  }
}

/**
 * Filter tools based on search options
 */
function filterTools(tools: ToolMetadata[], options?: ToolSearchOptions): ToolMetadata[] {
  if (!options) return tools

  let filtered = tools

  // Filter by category
  if (options.category) {
    const categories = Array.isArray(options.category) ? options.category : [options.category]
    filtered = filtered.filter(tool => categories.includes(tool.category))
  }

  // Filter by tags
  if (options.tags) {
    const tags = Array.isArray(options.tags) ? options.tags : [options.tags]
    filtered = filtered.filter(tool =>
      tags.some(tag => tool.tags.includes(tag))
    )
  }

  // Filter by complexity
  if (options.complexity) {
    const complexities = Array.isArray(options.complexity) ? options.complexity : [options.complexity]
    filtered = filtered.filter(tool => complexities.includes(tool.complexity))
  }

  // Filter by pagination support
  if (options.withPagination !== undefined) {
    filtered = filtered.filter(tool => tool.supportsPagination === options.withPagination)
  }

  // Filter by filtering support
  if (options.withFiltering !== undefined) {
    filtered = filtered.filter(tool => tool.supportsFiltering === options.withFiltering)
  }

  // Filter by audit logging
  if (options.withAuditLogging !== undefined) {
    filtered = filtered.filter(tool => tool.hasAuditLogging === options.withAuditLogging)
  }

  // Search in names and descriptions
  if (options.search) {
    const searchLower = options.search.toLowerCase()
    filtered = filtered.filter(tool =>
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  return filtered
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolMetadata[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.category === category)
}

/**
 * Get all categories with counts
 */
export function getCategorySummary(): Record<ToolCategory, number> {
  const categories: Record<ToolCategory, number> = {
    analyze: 0,
    navigate: 0,
    search: 0,
    transform: 0,
    audit: 0,
    utility: 0
  }

  for (const tool of Object.values(TOOL_REGISTRY)) {
    categories[tool.category]++
  }

  return categories
}
