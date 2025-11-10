import * as crypto from 'crypto'
import { findFiles, readFileSafe, getProjectPath } from '../../utils/fs-utils.js'

/**
 * Code block information
 */
export interface CodeBlock {
  file: string
  startLine: number
  endLine: number
  code: string
  hash: string
}

/**
 * Duplicate code group
 */
export interface DuplicateGroup {
  hash: string
  occurrences: CodeBlock[]
  lines: number
  duplicateCount: number
}

/**
 * Duplicate analysis summary
 */
export interface DuplicateSummary {
  totalFiles: number
  totalDuplicateGroups: number
  totalDuplicateLines: number
  duplicatePercentage: number
  largestDuplicates: DuplicateGroup[]
}

/**
 * Input parameters for findDuplicates
 */
export interface FindDuplicatesInput {
  /** Glob pattern for files to analyze */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Minimum lines for a block to be considered (default: 5) */
  minLines?: number
  /** Number of largest duplicates to return (default: 10) */
  topN?: number
}

/**
 * Output from findDuplicates
 */
export interface FindDuplicatesOutput {
  duplicates: DuplicateGroup[]
  summary: DuplicateSummary
}

/**
 * Find duplicate code blocks across project files
 *
 * Uses sliding window approach to find duplicate code blocks.
 * Ignores whitespace and comments for matching.
 *
 * @example
 * ```typescript
 * const analysis = await findDuplicates({
 *   pattern: 'src/**\/*.{ts,tsx}',
 *   minLines: 5,
 *   topN: 10
 * })
 *
 * console.log(`Found ${analysis.summary.totalDuplicateGroups} duplicate groups`)
 * console.log(`Total duplicate lines: ${analysis.summary.totalDuplicateLines}`)
 *
 * for (const dup of analysis.summary.largestDuplicates) {
 *   console.log(`\nDuplicate (${dup.lines} lines, ${dup.duplicateCount} occurrences):`)
 *   for (const block of dup.occurrences) {
 *     console.log(`  - ${block.file}:${block.startLine}-${block.endLine}`)
 *   }
 * }
 * ```
 */
export async function findDuplicates(
  input: FindDuplicatesInput = {}
): Promise<FindDuplicatesOutput> {
  const { pattern = 'src/**/*.{ts,tsx,js,jsx}', exclude, minLines = 5, topN = 10 } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  // Map of hash -> code blocks
  const blockMap = new Map<string, CodeBlock[]>()
  let totalLines = 0

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const content = readFileSafe(fullPath)
    if (!content) continue

    const lines = content.split('\n')
    totalLines += lines.length

    // Extract blocks using sliding window
    for (let i = 0; i <= lines.length - minLines; i++) {
      const blockLines = lines.slice(i, i + minLines)

      // Normalize: remove leading/trailing whitespace and empty lines
      const normalized = blockLines
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('/*'))
        .join('\n')

      if (normalized.length < 20) continue // Skip trivial blocks

      // Hash the normalized block
      const hash = crypto.createHash('md5').update(normalized).digest('hex')

      const block: CodeBlock = {
        file,
        startLine: i + 1,
        endLine: i + minLines,
        code: blockLines.join('\n'),
        hash
      }

      if (!blockMap.has(hash)) {
        blockMap.set(hash, [])
      }
      blockMap.get(hash)!.push(block)
    }
  }

  // Find actual duplicates (blocks that appear more than once)
  const duplicateGroups: DuplicateGroup[] = []
  let totalDuplicateLines = 0

  for (const [hash, blocks] of blockMap.entries()) {
    if (blocks.length <= 1) continue // Not a duplicate

    // Check if blocks are from different files or different locations
    const uniqueLocations = new Set(blocks.map(b => `${b.file}:${b.startLine}`))
    if (uniqueLocations.size <= 1) continue

    const group: DuplicateGroup = {
      hash,
      occurrences: blocks,
      lines: minLines,
      duplicateCount: blocks.length
    }

    duplicateGroups.push(group)
    totalDuplicateLines += minLines * (blocks.length - 1) // Don't count the first occurrence
  }

  // Sort by number of duplicates, then by lines
  duplicateGroups.sort((a, b) => {
    if (a.duplicateCount !== b.duplicateCount) {
      return b.duplicateCount - a.duplicateCount
    }
    return b.lines - a.lines
  })

  const summary: DuplicateSummary = {
    totalFiles: files.length,
    totalDuplicateGroups: duplicateGroups.length,
    totalDuplicateLines,
    duplicatePercentage: totalLines > 0 ? Math.round((totalDuplicateLines / totalLines) * 1000) / 10 : 0,
    largestDuplicates: duplicateGroups.slice(0, topN)
  }

  return {
    duplicates: duplicateGroups,
    summary
  }
}

export type { FindDuplicatesInput as Input, FindDuplicatesOutput as Output }
