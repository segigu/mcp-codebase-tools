import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput, type FileFilter } from '../../utils/types.js'

export interface RerenderIssue {
  file: string
  component: string
  issue: string
  reason: string
  fix: string
}

export interface RerendersDetectionInput extends PaginationInput {
  filter?: FileFilter
}

export interface RerendersDetectionOutput {
  suggestions: RerenderIssue[]
  totalIssues: number
  hasMore: boolean
  nextOffset?: number
}

export async function rerendersDetection(
  input: RerendersDetectionInput = {}
): Promise<RerendersDetectionOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx}'
  const files = findFiles(filePattern)
  const allSuggestions: RerenderIssue[] = []

  for (const file of files) {
    const code = readFileSafe(file)

    // Detect inline arrow functions in JSX
    if (code.includes('onClick={() =>') || code.includes('onChange={() =>')) {
      allSuggestions.push({
        file,
        component: file.split('/').pop() || file,
        issue: 'Inline arrow function in prop',
        reason: 'Creates new function on every render',
        fix: 'Use useCallback to memoize function'
      })
    }

    // Detect missing dependencies in hooks
    const useMemoRegex = /useMemo\([^,]+,\s*\[([^\]]*)\]/g
    let match
    while ((match = useMemoRegex.exec(code)) !== null) {
      const deps = match[1]
      if (deps.trim() === '') {
        allSuggestions.push({
          file,
          component: file.split('/').pop() || file,
          issue: 'Empty dependency array in useMemo',
          reason: 'Might be missing dependencies',
          fix: 'Review and add required dependencies'
        })
      }
    }
  }

  // Apply pagination
  const paginatedSuggestions = allSuggestions.slice(offset, offset + limit)

  const result = {
    suggestions: paginatedSuggestions,
    totalIssues: allSuggestions.length,
    hasMore: offset + limit < allSuggestions.length,
    nextOffset: offset + limit < allSuggestions.length ? offset + limit : undefined
  }

  // Log audit result
  logAuditResult(
    'rerendersDetection',
    'mcp:rerenders-detection',
    {
      summary: {
        totalIssues: allSuggestions.length,
        inlineArrowFunctions: allSuggestions.filter(s => s.issue.includes('Inline arrow')).length,
        emptyDependencies: allSuggestions.filter(s => s.issue.includes('Empty dependency')).length
      },
      stats: {
        totalIssues: allSuggestions.length,
        filesAnalyzed: files.length
      }
    },
    Date.now() - startTime
  )

  return result
}
