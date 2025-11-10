import { findFiles } from '../../utils/fs-utils.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput } from '../../utils/types.js'
import { execSync } from 'child_process'

export interface GitHotspot {
  file: string
  commits: number
  contributors: number
  risk: 'high' | 'medium' | 'low'
  reason: string
  suggestion: string
}

export interface GitHotspotsInput extends PaginationInput {}

export interface GitHotspotsOutput {
  hotspots: GitHotspot[]
  totalHotspots: number
  commitPatterns: {
    fixCommits: number
    featureCommits: number
    refactorCommits: number
    ratio: string
  }
  hasMore: boolean
  nextOffset?: number
}

export async function gitHotspots(
  input: GitHotspotsInput = {}
): Promise<GitHotspotsOutput> {
  const startTime = Date.now()
  const { limit = 50, offset = 0 } = input

  try {
    // Get files with most commits
    const output = execSync('git log --format=format: --name-only | sort | uniq -c | sort -rn | head -100')
      .toString()
      .trim()

    const lines = output.split('\n')
    const allHotspots: GitHotspot[] = []

    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+(.+)$/)
      if (match) {
        const [, commits, file] = match
        const commitCount = parseInt(commits)

        if (commitCount > 10) {
          allHotspots.push({
            file,
            commits: commitCount,
            contributors: 1,
            risk: commitCount > 50 ? 'high' : commitCount > 25 ? 'medium' : 'low',
            reason: 'Changed too frequently',
            suggestion: 'Consider refactoring or splitting'
          })
        }
      }
    }

    // Apply pagination
    const paginatedHotspots = allHotspots.slice(offset, offset + limit)

    // Count commit types
    const commits = execSync('git log --oneline').toString().split('\n')
    const fixCommits = commits.filter(c => c.includes('fix')).length
    const featureCommits = commits.filter(c => c.includes('feat')).length
    const refactorCommits = commits.filter(c => c.includes('refactor')).length

    const ratio = featureCommits > 0 ? (fixCommits / featureCommits).toFixed(2) : '0'

    const result = {
      hotspots: paginatedHotspots,
      totalHotspots: allHotspots.length,
      commitPatterns: {
        fixCommits,
        featureCommits,
        refactorCommits,
        ratio: `${ratio} (${fixCommits} fixes / ${featureCommits} features)`
      },
      hasMore: offset + limit < allHotspots.length,
      nextOffset: offset + limit < allHotspots.length ? offset + limit : undefined
    }

    // Log audit result
    logAuditResult(
      'gitHotspots',
      'mcp:git-hotspots',
      {
        summary: {
          totalHotspots: allHotspots.length,
          highRiskFiles: allHotspots.filter(h => h.risk === 'high').length,
          mediumRiskFiles: allHotspots.filter(h => h.risk === 'medium').length,
          fixToFeatureRatio: ratio
        },
        stats: {
          totalHotspots: allHotspots.length,
          fixCommits,
          featureCommits,
          refactorCommits,
          ratio
        }
      },
      Date.now() - startTime
    )

    return result
  } catch (error) {
    return {
      hotspots: [],
      totalHotspots: 0,
      commitPatterns: {
        fixCommits: 0,
        featureCommits: 0,
        refactorCommits: 0,
        ratio: 'N/A (not a git repo or git not available)'
      },
      hasMore: false
    }
  }
}
