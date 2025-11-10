import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput, type AuditFilter } from '../../utils/types.js'

export interface A11yIssue {
  severity: 'critical' | 'high' | 'medium'
  type: string
  file: string
  line: number
  element: string
  fix: string
}

export interface A11yAuditInput extends PaginationInput {
  filter?: AuditFilter
}

export interface A11yAuditOutput {
  issues: A11yIssue[]
  totalIssues: number
  summary: {
    critical: number
    high: number
    medium: number
    score: string
  }
  hasMore: boolean
  nextOffset?: number
}

export async function a11yAudit(
  input: A11yAuditInput = {}
): Promise<A11yAuditOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx}'
  const files = findFiles(filePattern)
  const allIssues: A11yIssue[] = []

  for (const file of files) {
    const code = readFileSafe(file)
    const lines = code.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for missing alt on images
      if (line.includes('<img') && !line.includes('alt=')) {
        allIssues.push({
          severity: 'critical',
          type: 'missing-alt',
          file,
          line: i + 1,
          element: line.trim(),
          fix: 'Add alt attribute to describe image'
        })
      }

      // Check for missing labels on inputs
      if (line.includes('<input') && !line.includes('aria-label') && !line.includes('id=')) {
        allIssues.push({
          severity: 'high',
          type: 'missing-label',
          file,
          line: i + 1,
          element: line.trim(),
          fix: 'Add aria-label or associate with <label>'
        })
      }

      // Check for button without text
      if (line.includes('<button') && line.includes('/>')) {
        allIssues.push({
          severity: 'high',
          type: 'empty-button',
          file,
          line: i + 1,
          element: line.trim(),
          fix: 'Add descriptive text or aria-label'
        })
      }
    }
  }

  // Apply filters
  let filteredIssues = allIssues
  if (filter.severity) {
    filteredIssues = filteredIssues.filter(i =>
      filter.severity!.includes(i.severity)
    )
  }

  // Apply pagination
  const paginatedIssues = filteredIssues.slice(offset, offset + limit)

  const summary = {
    critical: allIssues.filter(i => i.severity === 'critical').length,
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    score: allIssues.length < 5 ? '90/100' : allIssues.length < 20 ? '70/100' : '50/100'
  }

  const result = {
    issues: paginatedIssues,
    totalIssues: filteredIssues.length,
    summary,
    hasMore: offset + limit < filteredIssues.length,
    nextOffset: offset + limit < filteredIssues.length ? offset + limit : undefined
  }

  // Log audit result
  logAuditResult(
    'a11yAudit',
    'mcp:a11y-audit',
    {
      summary: {
        score: summary.score,
        totalIssues: allIssues.length,
        ...summary
      },
      issues: paginatedIssues.slice(0, 10), // Top 10 issues
      score: summary.score
    },
    Date.now() - startTime
  )

  return result
}
