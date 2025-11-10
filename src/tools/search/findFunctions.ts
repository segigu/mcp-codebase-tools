import { findFiles, getProjectPath } from '../../utils/fs-utils.js'
import { extractFunctions, type FunctionInfo } from '../../utils/ast-utils.js'

/**
 * Function match result
 */
export interface FunctionMatch {
  file: string
  function: FunctionInfo
}

/**
 * Input parameters for findFunctions
 */
export interface FindFunctionsInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Function name to search for (optional, returns all if not specified) */
  name?: string
  /** Function type filter */
  type?: 'function' | 'arrow' | 'method' | 'class-method'
  /** Only include async functions */
  asyncOnly?: boolean
  /** Only include exported functions */
  exportedOnly?: boolean
  /** Minimum complexity threshold */
  minComplexity?: number
}

/**
 * Output from findFunctions
 */
export interface FindFunctionsOutput {
  matches: FunctionMatch[]
  totalFunctions: number
  totalFiles: number
}

/**
 * Find functions/methods in the codebase
 *
 * @example
 * ```typescript
 * // Find all functions
 * const allFunctions = await findFunctions({
 *   pattern: 'src/**\/*.{ts,tsx}'
 * })
 *
 * // Find specific function
 * const fetchUser = await findFunctions({
 *   pattern: 'src/**\/*.ts',
 *   name: 'fetchUser'
 * })
 *
 * // Find complex async functions
 * const complexAsync = await findFunctions({
 *   pattern: 'src/**\/*.ts',
 *   asyncOnly: true,
 *   minComplexity: 10
 * })
 *
 * for (const match of fetchUser.matches) {
 *   console.log(`${match.file}:${match.function.line} - ${match.function.name}`)
 *   console.log(`  Complexity: ${match.function.complexity}`)
 * }
 * ```
 */
export async function findFunctions(input: FindFunctionsInput = {}): Promise<FindFunctionsOutput> {
  const {
    pattern = 'src/**/*.{ts,tsx,js,jsx}',
    exclude,
    name,
    type,
    asyncOnly = false,
    exportedOnly = false,
    minComplexity
  } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const matches: FunctionMatch[] = []
  const filesWithFunctions = new Set<string>()

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const functions = extractFunctions(fullPath)

    for (const func of functions) {
      // Apply filters
      if (name && func.name !== name) continue
      if (type && func.type !== type) continue
      if (asyncOnly && !func.isAsync) continue
      if (exportedOnly && !func.isExported) continue
      if (minComplexity !== undefined && func.complexity < minComplexity) continue

      matches.push({
        file,
        function: func
      })

      filesWithFunctions.add(file)
    }
  }

  // Sort by file, then by line
  matches.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    return a.function.line - b.function.line
  })

  return {
    matches,
    totalFunctions: matches.length,
    totalFiles: filesWithFunctions.size
  }
}

export type { FindFunctionsInput as Input, FindFunctionsOutput as Output }
