import { findFiles, getProjectPath } from '../../utils/fs-utils.js'
import { extractImports, type ImportInfo } from '../../utils/ast-utils.js'

/**
 * Import match result
 */
export interface ImportMatch {
  file: string
  import: ImportInfo
  specifier: {
    imported: string
    local: string
    type: 'default' | 'named' | 'namespace'
  }
}

/**
 * Input parameters for findImports
 */
export interface FindImportsInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Component/module name to search for */
  name?: string
  /** Source path to filter by (e.g., '@/components/ui/button') */
  source?: string
  /** Import type filter */
  importType?: 'default' | 'named' | 'namespace'
}

/**
 * Output from findImports
 */
export interface FindImportsOutput {
  matches: ImportMatch[]
  totalImports: number
  totalFiles: number
  importSources: string[]
}

/**
 * Find imports of a component/module in the codebase
 *
 * This is the MAIN USE CASE that saves tokens:
 * Instead of reading 50 files to find where Button is used,
 * analyze all files in code and return only the matches.
 *
 * @example
 * ```typescript
 * // Find where Button is imported
 * const buttonImports = await findImports({
 *   pattern: 'src/**\/*.tsx',
 *   name: 'Button'
 * })
 *
 * console.log(`Button is imported in ${buttonImports.totalFiles} files`)
 *
 * for (const match of buttonImports.matches) {
 *   console.log(`${match.file}:${match.import.line}`)
 *   console.log(`  from "${match.import.source}"`)
 * }
 *
 * // Find all imports from specific source
 * const uiImports = await findImports({
 *   pattern: 'src/**\/*.tsx',
 *   source: '@/components/ui'
 * })
 * ```
 */
export async function findImports(input: FindImportsInput = {}): Promise<FindImportsOutput> {
  const { pattern = 'src/**/*.{ts,tsx,js,jsx}', exclude, name, source, importType } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const matches: ImportMatch[] = []
  const filesWithImports = new Set<string>()
  const importSources = new Set<string>()

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const imports = extractImports(fullPath)

    for (const imp of imports) {
      // Filter by source if specified
      if (source && !imp.source.includes(source)) continue

      for (const spec of imp.specifiers) {
        // Filter by name if specified
        if (name && spec.imported !== name && spec.local !== name) continue

        // Filter by import type if specified
        if (importType && spec.type !== importType) continue

        matches.push({
          file,
          import: imp,
          specifier: spec
        })

        filesWithImports.add(file)
        importSources.add(imp.source)
      }
    }
  }

  // Sort by file, then by line
  matches.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    return a.import.line - b.import.line
  })

  return {
    matches,
    totalImports: matches.length,
    totalFiles: filesWithImports.size,
    importSources: Array.from(importSources).sort()
  }
}

export type { FindImportsInput as Input, FindImportsOutput as Output }
