import { findFiles, getProjectPath } from '../../utils/fs-utils.js'
import { extractExports, extractImports, type ExportInfo, type ImportInfo } from '../../utils/ast-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'

/**
 * Unused export information
 */
export interface UnusedExport {
  file: string
  exportName: string
  exportType: 'default' | 'named'
  line: number
}

/**
 * Unused exports summary
 */
export interface UnusedExportsSummary {
  totalFiles: number
  totalExports: number
  totalImports: number
  unusedExports: number
  unusedPercentage: number
  filesWithUnusedExports: number
}

/**
 * Input parameters for analyzeUnusedExports
 */
export interface AnalyzeUnusedExportsInput {
  /** Glob pattern for files to analyze */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Include default exports in analysis (default: false, as they might be used externally) */
  includeDefaults?: boolean
}

/**
 * Output from analyzeUnusedExports
 */
export interface AnalyzeUnusedExportsOutput {
  unused: UnusedExport[]
  summary: UnusedExportsSummary
}

/**
 * Analyze unused exports across project files
 *
 * Finds exported functions/variables/types that are never imported anywhere in the project.
 * Note: This doesn't account for dynamic imports or external usage (like npm packages).
 *
 * @example
 * ```typescript
 * const analysis = await analyzeUnusedExports({
 *   pattern: 'src/**\/*.{ts,tsx}',
 *   includeDefaults: false
 * })
 *
 * console.log(`Found ${analysis.summary.unusedExports} unused exports`)
 * console.log(`Unused percentage: ${analysis.summary.unusedPercentage}%`)
 *
 * for (const unused of analysis.unused) {
 *   console.log(`${unused.file}:${unused.line} - ${unused.exportName} (${unused.exportType})`)
 * }
 * ```
 */
export async function analyzeUnusedExports(
  input: AnalyzeUnusedExportsInput = {}
): Promise<AnalyzeUnusedExportsOutput> {
  const startTime = Date.now()
  const { pattern = 'src/**/*.{ts,tsx,js,jsx}', exclude, includeDefaults = false } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  // Collect all exports
  const allExports = new Map<string, ExportInfo & { file: string }>()
  let totalExportsCount = 0

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const exports = extractExports(fullPath)

    for (const exp of exports) {
      // Skip default exports if not included
      if (!includeDefaults && exp.type === 'default') continue

      const key = `${file}:${exp.name}`
      allExports.set(key, { ...exp, file })
      totalExportsCount++
    }
  }

  // Collect all imports
  const allImports = new Set<string>()
  let totalImportsCount = 0

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const imports = extractImports(fullPath)

    for (const imp of imports) {
      for (const spec of imp.specifiers) {
        // Try to resolve the import to a file in our project
        const importedName = spec.imported === 'default' ? 'default' : spec.imported

        // Match imports to exports
        // This is simplified - doesn't handle path aliases or complex resolution
        for (const [exportKey, exportInfo] of allExports.entries()) {
          if (exportInfo.name === importedName) {
            allImports.add(exportKey)
          }
        }

        totalImportsCount++
      }
    }
  }

  // Find unused exports
  const unused: UnusedExport[] = []

  for (const [key, exportInfo] of allExports.entries()) {
    if (!allImports.has(key)) {
      unused.push({
        file: exportInfo.file,
        exportName: exportInfo.name,
        exportType: exportInfo.type,
        line: exportInfo.line
      })
    }
  }

  // Sort by file, then by line
  unused.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    return a.line - b.line
  })

  const filesWithUnused = new Set(unused.map(u => u.file)).size

  const summary: UnusedExportsSummary = {
    totalFiles: files.length,
    totalExports: totalExportsCount,
    totalImports: totalImportsCount,
    unusedExports: unused.length,
    unusedPercentage:
      totalExportsCount > 0 ? Math.round((unused.length / totalExportsCount) * 1000) / 10 : 0,
    filesWithUnusedExports: filesWithUnused
  }

  const result = {
    unused,
    summary
  }

  // Log audit result
  logAuditResult(
    'analyzeUnusedExports',
    'mcp:unused',
    {
      summary: {
        unusedExports: unused.length,
        unusedPercentage: `${summary.unusedPercentage}%`,
        totalExports: totalExportsCount,
        filesWithUnused: filesWithUnused
      },
      stats: {
        totalFiles: files.length,
        totalExports: totalExportsCount,
        totalImports: totalImportsCount,
        unusedExports: unused.length,
        unusedPercentage: summary.unusedPercentage
      }
    },
    Date.now() - startTime
  )

  return result
}

export type { AnalyzeUnusedExportsInput as Input, AnalyzeUnusedExportsOutput as Output }
