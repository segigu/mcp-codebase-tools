import { findFiles, countLines, getProjectPath } from '../../utils/fs-utils.js'
import { extractFunctions, type FunctionInfo } from '../../utils/ast-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'

/**
 * File complexity metrics
 */
export interface FileComplexity {
  file: string
  lines: number
  functions: number
  avgComplexity: number
  maxComplexity: number
  complexFunctions: Array<{
    name: string
    complexity: number
    line: number
  }>
  score: 'low' | 'medium' | 'high' | 'very-high'
}

/**
 * Project complexity summary
 */
export interface ComplexitySummary {
  totalFiles: number
  totalLines: number
  totalFunctions: number
  avgComplexity: number
  filesWithHighComplexity: number
  topComplexFiles: FileComplexity[]
}

/**
 * Input parameters for analyzeComplexity
 */
export interface AnalyzeComplexityInput {
  /** Glob pattern for files to analyze */
  pattern?: string
  /** File extensions to include */
  extensions?: string[]
  /** Patterns to exclude */
  exclude?: string[]
  /** Complexity threshold for "complex" functions (default: 10) */
  complexityThreshold?: number
  /** Number of top complex files to return (default: 10) */
  topN?: number
}

/**
 * Output from analyzeComplexity
 */
export interface AnalyzeComplexityOutput {
  files: FileComplexity[]
  summary: ComplexitySummary
}

/**
 * Analyze code complexity across project files
 *
 * @example
 * ```typescript
 * const analysis = await analyzeComplexity({
 *   pattern: 'src/**\/*.{ts,tsx}',
 *   complexityThreshold: 10,
 *   topN: 10
 * })
 *
 * console.log(`Total files analyzed: ${analysis.summary.totalFiles}`)
 * console.log(`Files with high complexity: ${analysis.summary.filesWithHighComplexity}`)
 *
 * for (const file of analysis.summary.topComplexFiles) {
 *   console.log(`${file.file}: ${file.maxComplexity} (${file.score})`)
 * }
 * ```
 */
export async function analyzeComplexity(
  input: AnalyzeComplexityInput = {}
): Promise<AnalyzeComplexityOutput> {
  const startTime = Date.now()
  const {
    pattern = 'src/**/*.{ts,tsx,js,jsx}',
    extensions,
    exclude,
    complexityThreshold = 10,
    topN = 10
  } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const fileComplexities: FileComplexity[] = []
  let totalFunctions = 0
  let totalComplexity = 0

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const lines = countLines(fullPath)

    // Extract functions and their complexity
    const functions = extractFunctions(fullPath)

    if (functions.length === 0) {
      continue // Skip files with no functions
    }

    totalFunctions += functions.length

    const complexities = functions.map(f => f.complexity)
    const sumComplexity = complexities.reduce((sum, c) => sum + c, 0)
    const avgComplexity = sumComplexity / functions.length
    const maxComplexity = Math.max(...complexities)

    totalComplexity += sumComplexity

    // Find complex functions (above threshold)
    const complexFunctions = functions
      .filter(f => f.complexity >= complexityThreshold)
      .map(f => ({
        name: f.name,
        complexity: f.complexity,
        line: f.line
      }))
      .sort((a, b) => b.complexity - a.complexity)

    // Calculate complexity score
    let score: FileComplexity['score']
    if (maxComplexity < 5) score = 'low'
    else if (maxComplexity < 10) score = 'medium'
    else if (maxComplexity < 20) score = 'high'
    else score = 'very-high'

    fileComplexities.push({
      file,
      lines,
      functions: functions.length,
      avgComplexity: Math.round(avgComplexity * 10) / 10,
      maxComplexity,
      complexFunctions,
      score
    })
  }

  // Sort by max complexity descending
  fileComplexities.sort((a, b) => b.maxComplexity - a.maxComplexity)

  // Calculate summary
  const summary: ComplexitySummary = {
    totalFiles: fileComplexities.length,
    totalLines: fileComplexities.reduce((sum, f) => sum + f.lines, 0),
    totalFunctions,
    avgComplexity: totalFunctions > 0 ? Math.round((totalComplexity / totalFunctions) * 10) / 10 : 0,
    filesWithHighComplexity: fileComplexities.filter(f => f.score === 'high' || f.score === 'very-high')
      .length,
    topComplexFiles: fileComplexities.slice(0, topN)
  }

  const result = {
    files: fileComplexities,
    summary
  }

  // Log audit result
  logAuditResult(
    'analyzeComplexity',
    'mcp:complexity',
    {
      summary: {
        avgComplexity: summary.avgComplexity,
        filesWithHighComplexity: summary.filesWithHighComplexity,
        totalFiles: summary.totalFiles,
        totalFunctions: summary.totalFunctions
      },
      stats: {
        totalFiles: summary.totalFiles,
        totalLines: summary.totalLines,
        totalFunctions: summary.totalFunctions,
        avgComplexity: summary.avgComplexity,
        filesWithHighComplexity: summary.filesWithHighComplexity
      }
    },
    Date.now() - startTime
  )

  return result
}

export type { AnalyzeComplexityInput as Input, AnalyzeComplexityOutput as Output }
