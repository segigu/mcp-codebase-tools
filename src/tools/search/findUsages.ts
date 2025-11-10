import { findFiles, readFileSafe, getProjectPath } from '../../utils/fs-utils.js'

/**
 * Usage location
 */
export interface UsageLocation {
  file: string
  line: number
  column: number
  context: string
}

/**
 * Input parameters for findUsages
 */
export interface FindUsagesInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Symbol name to search for */
  symbolName: string
  /** Case sensitive search (default: true) */
  caseSensitive?: boolean
  /** Include context lines (default: 0) */
  contextLines?: number
}

/**
 * Output from findUsages
 */
export interface FindUsagesOutput {
  symbolName: string
  usages: UsageLocation[]
  totalUsages: number
  totalFiles: number
}

/**
 * Find usages of a symbol (variable, function, class, component) in the codebase
 *
 * Uses regex-based search for simplicity. For more accurate results,
 * consider using TypeScript Language Service in the future.
 *
 * @example
 * ```typescript
 * // Find where fetchUser function is called
 * const usages = await findUsages({
 *   pattern: 'src/**\/*.{ts,tsx}',
 *   symbolName: 'fetchUser'
 * })
 *
 * console.log(`Found ${usages.totalUsages} usages of fetchUser`)
 *
 * for (const usage of usages.usages) {
 *   console.log(`${usage.file}:${usage.line}:${usage.column}`)
 *   console.log(`  ${usage.context}`)
 * }
 * ```
 */
export async function findUsages(input: FindUsagesInput): Promise<FindUsagesOutput> {
  const {
    pattern = 'src/**/*.{ts,tsx,js,jsx}',
    exclude,
    symbolName,
    caseSensitive = true,
    contextLines = 0
  } = input

  if (!symbolName) {
    throw new Error('symbolName is required')
  }

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const usages: UsageLocation[] = []
  const filesWithUsages = new Set<string>()

  // Create regex for finding the symbol
  // Look for word boundaries to avoid partial matches
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(`\\b${symbolName}\\b`, flags)

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const content = readFileSafe(fullPath)
    if (!content) continue

    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matches = [...line.matchAll(regex)]

      for (const match of matches) {
        const column = (match.index ?? 0) + 1 // 1-indexed

        // Get context (current line + surrounding lines)
        let context = line

        if (contextLines > 0) {
          const startLine = Math.max(0, i - contextLines)
          const endLine = Math.min(lines.length - 1, i + contextLines)
          context = lines.slice(startLine, endLine + 1).join('\n')
        }

        usages.push({
          file,
          line: i + 1, // 1-indexed
          column,
          context: context.trim()
        })

        filesWithUsages.add(file)
      }
    }
  }

  // Sort by file, then by line
  usages.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    return a.line - b.line
  })

  return {
    symbolName,
    usages,
    totalUsages: usages.length,
    totalFiles: filesWithUsages.size
  }
}

export type { FindUsagesInput as Input, FindUsagesOutput as Output }
