/**
 * Audit Logger - Centralized logging for all audit results
 *
 * Automatically logs results from:
 * - securityAudit
 * - i18nAnalysis
 * - a11yAudit
 * - testCoverageGaps
 * - techDebtCalculator
 * - unusedExports
 * - complexity
 * - gitHotspots
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { markAuditRun, getNextStepsMessage } from './audit-status.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string                    // Unique ID (timestamp-based)
  timestamp: string             // ISO 8601 timestamp
  command: string               // Command executed (e.g., 'mcp:security-audit')
  tool: string                  // Tool name (e.g., 'securityAudit')
  results: {
    summary: Record<string, any>  // High-level summary
    issues?: any[]                // List of issues found
    score?: string                // Overall score (if applicable)
    stats?: Record<string, number> // Numeric statistics
  }
  trends?: {
    vs_previous?: {
      issues_delta: number      // Change in issue count
      score_delta?: number      // Change in score
      improved: boolean         // Overall improvement
    }
  }
  duration_ms?: number          // Execution time
}

/**
 * Audit log structure
 */
export interface AuditLog {
  schema_version: string
  project: string
  audits: AuditLogEntry[]
}

/**
 * Get path to audit log file
 */
function getAuditLogPath(): string {
  // Assuming this is run from mcp-server, go up to project root
  const projectRoot = path.resolve(__dirname, '..', '..')
  return path.join(projectRoot, 'docs', 'audits', 'AUDIT_LOG.json')
}

/**
 * Read audit log
 */
export function readAuditLog(): AuditLog {
  const logPath = getAuditLogPath()

  if (!fs.existsSync(logPath)) {
    // Create initial log if doesn't exist
    const initialLog: AuditLog = {
      schema_version: '1.0.0',
      project: 'Metacell',
      audits: []
    }
    fs.mkdirSync(path.dirname(logPath), { recursive: true })
    fs.writeFileSync(logPath, JSON.stringify(initialLog, null, 2), 'utf-8')
    return initialLog
  }

  const content = fs.readFileSync(logPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Write audit log
 */
function writeAuditLog(log: AuditLog): void {
  const logPath = getAuditLogPath()
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8')
}

/**
 * Find previous audit entry for the same tool
 */
function findPreviousAudit(log: AuditLog, tool: string): AuditLogEntry | null {
  // Find most recent audit for this tool
  const previousAudits = log.audits.filter(a => a.tool === tool)
  if (previousAudits.length === 0) return null

  // Return most recent (last in array)
  return previousAudits[previousAudits.length - 1]
}

/**
 * Calculate trends vs previous audit
 */
function calculateTrends(
  current: AuditLogEntry,
  previous: AuditLogEntry | null
): AuditLogEntry['trends'] {
  if (!previous) return undefined

  const currentIssuesCount = current.results.issues?.length || 0
  const previousIssuesCount = previous.results.issues?.length || 0
  const issues_delta = currentIssuesCount - previousIssuesCount

  let improved = false

  // Determine if improved based on issue count
  if (issues_delta < 0) {
    improved = true // Fewer issues = improvement
  }

  // Also check score if available
  if (current.results.score && previous.results.score) {
    const currentScore = parseFloat(current.results.score.match(/\d+/)?.[0] || '0')
    const previousScore = parseFloat(previous.results.score.match(/\d+/)?.[0] || '0')
    const score_delta = currentScore - previousScore

    if (score_delta > 0) {
      improved = true // Higher score = improvement
    }

    return {
      vs_previous: {
        issues_delta,
        score_delta,
        improved
      }
    }
  }

  return {
    vs_previous: {
      issues_delta,
      improved
    }
  }
}

/**
 * Log audit result
 *
 * @param tool - Tool name (e.g., 'securityAudit')
 * @param command - Command executed (e.g., 'mcp:security-audit')
 * @param results - Audit results
 * @param duration_ms - Optional execution time
 */
export function logAuditResult(
  tool: string,
  command: string,
  results: AuditLogEntry['results'],
  duration_ms?: number
): void {
  const log = readAuditLog()
  const timestamp = new Date().toISOString()
  const id = `${tool}-${Date.now()}`

  const entry: AuditLogEntry = {
    id,
    timestamp,
    command,
    tool,
    results,
    duration_ms
  }

  // Calculate trends
  const previous = findPreviousAudit(log, tool)
  entry.trends = calculateTrends(entry, previous)

  // Add to log
  log.audits.push(entry)

  // Keep only last 100 entries per tool to avoid file bloat
  const toolAudits = log.audits.filter(a => a.tool === tool)
  if (toolAudits.length > 100) {
    // Remove oldest entries for this tool
    const toRemove = toolAudits.length - 100
    let removed = 0
    log.audits = log.audits.filter(a => {
      if (a.tool === tool && removed < toRemove) {
        removed++
        return false
      }
      return true
    })
  }

  writeAuditLog(log)

  // Update audit status for reminder system
  const criticalIssuesCount = results.issues?.filter(
    (issue: any) => issue.severity === 'critical' || issue.severity === 'high'
  ).length || 0

  // Get project path - use the path where AUDIT_LOG.json is located
  // This is typically docs/audits/, so go up 2 levels
  const auditLogPath = getAuditLogPath()
  const projectRoot = path.resolve(path.dirname(auditLogPath), '..', '..')

  markAuditRun(projectRoot, criticalIssuesCount)

  // Show next steps reminder (only if there are critical issues)
  if (criticalIssuesCount > 0) {
    const nextSteps = getNextStepsMessage(criticalIssuesCount)
    console.log(nextSteps)
  }
}

/**
 * Get audit history for a specific tool
 *
 * @param tool - Tool name
 * @param limit - Max number of entries to return (default 10)
 */
export function getAuditHistory(tool: string, limit: number = 10): AuditLogEntry[] {
  const log = readAuditLog()
  const toolAudits = log.audits.filter(a => a.tool === tool)

  // Return most recent entries
  return toolAudits.slice(-limit).reverse()
}

/**
 * Get summary of all audits
 */
export function getAuditSummary(): {
  total_audits: number
  by_tool: Record<string, number>
  last_audit: AuditLogEntry | null
  tools_with_improvements: string[]
  tools_with_regressions: string[]
} {
  const log = readAuditLog()

  const by_tool: Record<string, number> = {}
  const tools_with_improvements: string[] = []
  const tools_with_regressions: string[] = []
  const latestByTool = new Map<string, AuditLogEntry>()

  for (const audit of log.audits) {
    by_tool[audit.tool] = (by_tool[audit.tool] || 0) + 1
    latestByTool.set(audit.tool, audit)
  }

  // Check trends in latest audits
  for (const [tool, audit] of latestByTool.entries()) {
    if (audit.trends?.vs_previous) {
      if (audit.trends.vs_previous.improved) {
        tools_with_improvements.push(tool)
      } else {
        tools_with_regressions.push(tool)
      }
    }
  }

  const last_audit = log.audits.length > 0
    ? log.audits[log.audits.length - 1]
    : null

  return {
    total_audits: log.audits.length,
    by_tool,
    last_audit,
    tools_with_improvements,
    tools_with_regressions
  }
}

/**
 * AuditLogger class - Wrapper for audit functions to provide class-based API
 */
export class AuditLogger {
  private projectPath: string

  constructor(projectPath: string) {
    this.projectPath = projectPath
  }

  /**
   * Get audit history for a specific tool
   */
  async getToolHistory(toolName: string) {
    const history = getAuditHistory(toolName, 100)

    if (history.length === 0) {
      return {
        executionCount: 0,
        lastExecuted: new Date().toISOString(),
        results: []
      }
    }

    const results = history.map(entry => ({
      timestamp: entry.timestamp,
      score: entry.results.score || 'N/A',
      grade: this.extractGrade(entry),
      trends: entry.trends?.vs_previous ? {
        scoreTrend: entry.trends.vs_previous.score_delta || 0
      } : undefined
    }))

    return {
      executionCount: history.length,
      lastExecuted: history[0]?.timestamp || new Date().toISOString(),
      results
    }
  }

  /**
   * Get summary of all audits
   */
  async getSummary() {
    const summary = getAuditSummary()
    const log = readAuditLog()

    // Group audits by tool
    const toolsMap = new Map<string, AuditLogEntry[]>()
    for (const audit of log.audits) {
      if (!toolsMap.has(audit.tool)) {
        toolsMap.set(audit.tool, [])
      }
      toolsMap.get(audit.tool)!.push(audit)
    }

    // Build tools object
    const tools: Record<string, any> = {}
    for (const [toolName, audits] of toolsMap.entries()) {
      const sortedAudits = audits.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const lastAudit = sortedAudits[sortedAudits.length - 1]

      tools[toolName] = {
        executionCount: audits.length,
        lastExecuted: lastAudit.timestamp,
        results: sortedAudits.map(audit => ({
          score: audit.results.score || 'N/A',
          grade: this.extractGrade(audit)
        }))
      }
    }

    return {
      totalExecutions: summary.total_audits,
      tools
    }
  }

  /**
   * Extract grade from audit entry
   */
  private extractGrade(entry: AuditLogEntry): string {
    // Try to find grade in summary
    if (entry.results.summary) {
      if (entry.results.summary.grade) {
        return entry.results.summary.grade
      }
      if (entry.results.summary.completeness) {
        return entry.results.summary.completeness
      }
    }
    return 'N/A'
  }
}
