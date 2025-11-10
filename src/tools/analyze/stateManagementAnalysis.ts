import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput, type FileFilter } from '../../utils/types.js'

export interface PropDrillingIssue {
  prop: string
  depth: number
  path: string[]
  suggestion: string
}

export interface StateManagementInput extends PaginationInput {
  filter?: FileFilter
}

export interface StateManagementOutput {
  propDrilling: PropDrillingIssue[]
  stateUsage: Record<string, number>
  unusedState: Array<{
    file: string
    state: string
    reason: string
  }>
  hasMore: boolean
  nextOffset?: number
}

export async function stateManagementAnalysis(
  input: StateManagementInput = {}
): Promise<StateManagementOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx,ts,js}'
  const files = findFiles(filePattern)
  const stateUsage: Record<string, number> = {}
  const allUnusedState: StateManagementOutput['unusedState'] = []

  for (const file of files) {
    const code = readFileSafe(file)

    // Count state management patterns
    const patterns = ['useState', 'useContext', 'useReducer', 'useSelector']
    for (const pattern of patterns) {
      const count = (code.match(new RegExp(pattern, 'g')) || []).length
      stateUsage[pattern] = (stateUsage[pattern] || 0) + count
    }

    // Detect unused state
    const stateRegex = /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g
    let match
    while ((match = stateRegex.exec(code)) !== null) {
      const stateName = match[1]
      const setterName = `set${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}`

      if (!code.includes(setterName + '(')) {
        allUnusedState.push({
          file,
          state: match[0],
          reason: `${setterName} never called`
        })
      }
    }
  }

  // Apply pagination to unusedState
  const paginatedUnusedState = allUnusedState.slice(offset, offset + limit)

  const result = {
    propDrilling: [],
    stateUsage,
    unusedState: paginatedUnusedState,
    hasMore: offset + limit < allUnusedState.length,
    nextOffset: offset + limit < allUnusedState.length ? offset + limit : undefined
  }

  // Log audit result
  logAuditResult(
    'stateManagementAnalysis',
    'mcp:state-management',
    {
      summary: {
        totalStateUsage: Object.values(stateUsage).reduce((sum, count) => sum + count, 0),
        unusedStateCount: allUnusedState.length,
        statePatterns: stateUsage
      },
      stats: {
        ...stateUsage,
        unusedState: allUnusedState.length
      }
    },
    Date.now() - startTime
  )

  return result
}
