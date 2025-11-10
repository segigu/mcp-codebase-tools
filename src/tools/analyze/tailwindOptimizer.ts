import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { type PaginationInput, type FileFilter } from '../../utils/types.js'

export interface TailwindPattern {
  classes: string
  count: number
  locations: string[]
  suggestion: string
  savings: string
}

export interface TailwindOptimizerInput extends PaginationInput {
  filter?: FileFilter
}

export interface TailwindOptimizerOutput {
  repeatingPatterns: TailwindPattern[]
  totalRepeatingPatterns: number
  totalSavings: string
  hasMore: boolean
  nextOffset?: number
}

export async function tailwindOptimizer(
  input: TailwindOptimizerInput = {}
): Promise<TailwindOptimizerOutput> {
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx}'
  const files = findFiles(filePattern)
  const patterns = new Map<string, string[]>()

  for (const file of files) {
    const code = readFileSafe(file)
    const classRegex = /className="([^"]+)"/g
    let match
    while ((match = classRegex.exec(code)) !== null) {
      const classes = match[1]
      if (classes.split(' ').length > 3) { // Only patterns with 3+ classes
        if (!patterns.has(classes)) {
          patterns.set(classes, [])
        }
        patterns.get(classes)!.push(file)
      }
    }
  }

  const allRepeatingPatterns: TailwindPattern[] = Array.from(patterns.entries())
    .filter(([_, files]) => files.length > 2) // Used 3+ times
    .map(([classes, locations]) => ({
      classes,
      count: locations.length,
      locations,
      suggestion: `Create utility class or component`,
      savings: `~${classes.length * locations.length} chars`
    }))
    .sort((a, b) => b.count - a.count)

  // Apply pagination
  const paginatedPatterns = allRepeatingPatterns.slice(offset, offset + limit)

  const totalSavings = allRepeatingPatterns.reduce((sum, p) =>
    sum + (p.classes.length * p.count), 0
  )

  return {
    repeatingPatterns: paginatedPatterns,
    totalRepeatingPatterns: allRepeatingPatterns.length,
    totalSavings: `~${Math.round(totalSavings / 1024)}KB`,
    hasMore: offset + limit < allRepeatingPatterns.length,
    nextOffset: offset + limit < allRepeatingPatterns.length ? offset + limit : undefined
  }
}
