import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput, type FileFilter } from '../../utils/types.js'
import * as path from 'path'

export interface BundleItem {
  module: string
  size: number // in bytes
  usage: number // number of imports
  suggestion: string
}

export interface BundleAnalysisInput extends PaginationInput {
  filter?: FileFilter
}

export interface BundleAnalysisOutput {
  topHeaviest: BundleItem[]
  totalTopHeaviest: number
  duplicates: Array<{
    package: string
    versions: string[]
    totalSize: number
    suggestion: string
  }>
  totalEstimatedSize: number
  optimizedSize: number
  hasMore: boolean
  nextOffset?: number
}

export async function bundleAnalysis(
  input: BundleAnalysisInput = {}
): Promise<BundleAnalysisOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0, filter = {} } = input

  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx,ts,js}'
  const files = findFiles(filePattern)
  const imports = new Map<string, number>()

  // Count imports
  for (const file of files) {
    const code = readFileSafe(file)
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g
    let match
    while ((match = importRegex.exec(code)) !== null) {
      const pkg = match[1]
      if (!pkg.startsWith('.')) { // External package
        const basePkg = pkg.split('/')[0]
        imports.set(basePkg, (imports.get(basePkg) || 0) + 1)
      }
    }
  }

  // Estimate sizes (rough approximation)
  const allTopHeaviest: BundleItem[] = Array.from(imports.entries())
    .map(([module, usage]) => ({
      module,
      size: usage * 10000, // Rough estimate
      usage,
      suggestion: usage < 3 ? `Consider if ${module} is necessary (only used ${usage}x)` : ''
    }))
    .sort((a, b) => b.size - a.size)

  // Apply pagination
  const paginatedTopHeaviest = allTopHeaviest.slice(offset, offset + limit)

  const totalEstimatedSize = allTopHeaviest.reduce((sum, item) => sum + item.size, 0)
  const optimizedSize = Math.round(totalEstimatedSize * 0.6) // Assume 40% reduction possible

  const result = {
    topHeaviest: paginatedTopHeaviest,
    totalTopHeaviest: allTopHeaviest.length,
    duplicates: [],
    totalEstimatedSize,
    optimizedSize,
    hasMore: offset + limit < allTopHeaviest.length,
    nextOffset: offset + limit < allTopHeaviest.length ? offset + limit : undefined
  }

  // Log audit result
  logAuditResult(
    'bundleAnalysis',
    'mcp:bundle-analysis',
    {
      summary: {
        totalModules: allTopHeaviest.length,
        totalEstimatedSize: `${Math.round(totalEstimatedSize / 1024)}KB`,
        optimizedSize: `${Math.round(optimizedSize / 1024)}KB`,
        potentialSavings: `${Math.round((totalEstimatedSize - optimizedSize) / 1024)}KB (40%)`
      },
      stats: {
        totalModules: allTopHeaviest.length,
        totalEstimatedSize,
        optimizedSize,
        potentialSavingsPercent: 40
      }
    },
    Date.now() - startTime
  )

  return result
}
