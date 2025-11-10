/**
 * Common Types for MCP Tools
 *
 * Base interfaces used across all analysis tools
 */

/**
 * Base pagination interface
 * Apply to all input types that return lists
 */
export interface PaginationInput {
  limit?: number   // Max results to return (default 50)
  offset?: number  // Skip first N results (default 0)
}

/**
 * Base pagination output
 * Include in all output types that return lists
 */
export interface PaginationOutput {
  hasMore: boolean      // Whether there are more results
  nextOffset?: number   // Offset for next page (undefined if no more)
}

/**
 * Standard output wrapper for paginated results
 */
export interface PaginatedOutput<T> extends PaginationOutput {
  items: T[]
  total: number
}

/**
 * Filter options for component-based analysis
 */
export interface ComponentFilter {
  withTests?: boolean
  complexity?: 'trivial' | 'simple' | 'moderate' | 'complex'
  minUsageCount?: number
  filePattern?: string
}

/**
 * Filter options for file-based analysis
 */
export interface FileFilter {
  filePattern?: string
  minSize?: number
  maxSize?: number
  extensions?: string[]
}

/**
 * Severity levels for audits
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

/**
 * Filter options for audit results
 */
export interface AuditFilter {
  severity?: SeverityLevel[]
  type?: string[]
  filePattern?: string
}
