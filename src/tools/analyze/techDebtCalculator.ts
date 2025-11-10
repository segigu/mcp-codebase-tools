import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput, type FileFilter } from '../../utils/types.js'

export interface TechDebtInput extends PaginationInput {
  filter?: FileFilter
}

export interface TechDebtOutput {
  todos: {
    total: number
    byPriority: Record<string, number>
    oldest: { comment: string; file: string; age: string } | null
  }
  complexity: {
    high: Array<{
      function: string
      file: string
      complexity: number
      threshold: number
      suggestion: string
    }>
  }
  deprecated: Array<{
    usage: string
    file: string
    deprecated: string
    fix: string
  }>
  debtScore: string
  hasMore: boolean
  nextOffset?: number
}

export async function techDebtCalculator(
  input: TechDebtInput = {}
): Promise<TechDebtOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx,ts,js}'
  const files = findFiles(filePattern)
  const todos = { total: 0, byPriority: {} as Record<string, number>, oldest: null }
  const complexity = { high: [] }
  const allDeprecated = []

  for (const file of files) {
    const code = readFileSafe(file)
    const lines = code.split('\n')

    for (const line of lines) {
      // Count TODOs
      if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
        todos.total++
        const priority = line.includes('FIXME') ? 'FIXME' :
                        line.includes('HACK') ? 'HACK' : 'TODO'
        todos.byPriority[priority] = (todos.byPriority[priority] || 0) + 1
      }

      // Check for deprecated APIs
      if (line.includes('findDOMNode') || line.includes('componentWillMount')) {
        allDeprecated.push({
          usage: line.trim(),
          file,
          deprecated: 'React 18',
          fix: 'Use modern React patterns'
        })
      }
    }
  }

  // Apply pagination to deprecated
  const paginatedDeprecated = allDeprecated.slice(offset, offset + limit)

  const debtScore = todos.total < 10 ? '90/100' :
                    todos.total < 50 ? '70/100' : '50/100'

  const result = {
    todos,
    complexity,
    deprecated: paginatedDeprecated,
    debtScore,
    hasMore: offset + limit < allDeprecated.length,
    nextOffset: offset + limit < allDeprecated.length ? offset + limit : undefined
  }

  // Log audit result
  logAuditResult(
    'techDebtCalculator',
    'mcp:tech-debt',
    {
      summary: {
        score: debtScore,
        totalTodos: todos.total,
        todosByPriority: todos.byPriority,
        deprecatedCount: allDeprecated.length
      },
      score: debtScore,
      stats: {
        todos: todos.total,
        fixmes: todos.byPriority['FIXME'] || 0,
        hacks: todos.byPriority['HACK'] || 0,
        deprecated: allDeprecated.length
      }
    },
    Date.now() - startTime
  )

  return result
}
