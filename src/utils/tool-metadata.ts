/**
 * Tool Metadata System - Progressive Detalization
 *
 * Provides 3 levels of information about MCP tools:
 * - list: Quick overview (names only)
 * - describe: Medium detail (names + descriptions)
 * - schema: Full detail (complete schemas + examples)
 */

/**
 * Tool category classification
 */
export type ToolCategory =
  | 'analyze'      // Code analysis tools
  | 'navigate'     // Code navigation tools
  | 'search'       // Search and query tools
  | 'transform'    // Code transformation tools
  | 'audit'        // Audit and quality tools
  | 'utility'      // Utility tools

/**
 * Tool complexity level
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex'

/**
 * Tool metadata interface
 */
export interface ToolMetadata {
  /** Tool identifier (same as function name) */
  id: string

  /** Display name */
  name: string

  /** Short description (1 sentence) */
  description: string

  /** Long description (2-3 sentences) */
  longDescription?: string

  /** Tool category */
  category: ToolCategory

  /** Tags for search and filtering */
  tags: string[]

  /** Complexity level */
  complexity: ComplexityLevel

  /** Dependencies on other tools */
  dependencies?: string[]

  /** MCP command to run this tool */
  command: string

  /** npm script name */
  npmScript: string

  /** Usage examples */
  examples?: ToolExample[]

  /** Input schema (TypeScript interface name) */
  inputType?: string

  /** Output schema (TypeScript interface name) */
  outputType?: string

  /** Pagination support */
  supportsPagination: boolean

  /** Filtering support */
  supportsFiltering: boolean

  /** Token usage estimate (for planning) */
  estimatedTokenUsage?: {
    min: number
    avg: number
    max: number
  }

  /** Performance estimate (ms) */
  estimatedDuration?: {
    min: number
    avg: number
    max: number
  }

  /** Audit logging enabled */
  hasAuditLogging?: boolean
}

/**
 * Tool usage example
 */
export interface ToolExample {
  /** Example title */
  title: string

  /** Command to run */
  command: string

  /** Description of what this does */
  description: string

  /** Expected output summary */
  expectedOutput?: string
}

/**
 * Tool detalization level
 */
export type DetailLevel = 'list' | 'describe' | 'schema'

/**
 * List output (minimal)
 */
export interface ToolListItem {
  id: string
  name: string
  category: ToolCategory
  npmScript: string
}

/**
 * Describe output (medium)
 */
export interface ToolDescription extends ToolListItem {
  description: string
  tags: string[]
  complexity: ComplexityLevel
  supportsPagination: boolean
  supportsFiltering: boolean
}

/**
 * Schema output (full)
 */
export interface ToolSchema extends ToolDescription {
  longDescription?: string
  command: string
  examples?: ToolExample[]
  inputType?: string
  outputType?: string
  dependencies?: string[]
  estimatedTokenUsage?: ToolMetadata['estimatedTokenUsage']
  estimatedDuration?: ToolMetadata['estimatedDuration']
  hasAuditLogging?: boolean
}

/**
 * Tool registry output format
 */
export interface ToolRegistryOutput {
  level: DetailLevel
  totalTools: number
  categories: Record<ToolCategory, number>
  tools: ToolListItem[] | ToolDescription[] | ToolSchema[]
}

/**
 * Search/filter options
 */
export interface ToolSearchOptions {
  /** Filter by category */
  category?: ToolCategory | ToolCategory[]

  /** Filter by tag */
  tags?: string | string[]

  /** Filter by complexity */
  complexity?: ComplexityLevel | ComplexityLevel[]

  /** Search in names and descriptions */
  search?: string

  /** Show only tools with pagination */
  withPagination?: boolean

  /** Show only tools with filtering */
  withFiltering?: boolean

  /** Show only tools with audit logging */
  withAuditLogging?: boolean
}
