/**
 * Code Health Check - Composite Skill
 *
 * Analyzes code quality and performance by combining:
 * - Complexity Analysis (cyclomatic complexity)
 * - Unused Exports (dead code detection)
 * - Rerenders Detection (React performance)
 * - State Management Analysis (React state patterns)
 *
 * Generates code health score and actionable improvements.
 */

import { analyzeComplexity, type AnalyzeComplexityOutput } from '../analyze/analyzeComplexity.js'
import { analyzeUnusedExports, type AnalyzeUnusedExportsOutput } from '../analyze/analyzeUnusedExports.js'
import { rerendersDetection, type RerendersDetectionOutput } from '../analyze/rerendersDetection.js'
import { stateManagementAnalysis, type StateManagementOutput } from '../analyze/stateManagementAnalysis.js'
import { logAuditResult } from '../../utils/audit-logger.js'
import { type PaginationInput } from '../../utils/types.js'

export interface CodeHealthCheckInput extends PaginationInput {
  // No additional filters
}

export interface CodeHealthMetrics {
  overall: number
  complexity: number
  deadCode: number
  performance: number
  stateManagement: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface CodeImprovement {
  category: 'complexity' | 'dead-code' | 'performance' | 'state'
  priority: 'high' | 'medium' | 'low'
  issue: string
  impact: string
  solution: string
  estimatedEffort: 'trivial' | 'easy' | 'moderate' | 'hard'
  filesAffected: number
}

export interface CodeHealthCheckOutput {
  healthMetrics: CodeHealthMetrics
  summary: {
    totalIssues: number
    highPriorityIssues: number
    mediumPriorityIssues: number
    lowPriorityIssues: number
    filesAnalyzed: number
  }
  improvements: CodeImprovement[]
  detailedResults: {
    complexity: AnalyzeComplexityOutput
    unusedExports: AnalyzeUnusedExportsOutput
    rerenders: RerendersDetectionOutput
    stateManagement: StateManagementOutput
  }
  quickWins: string[]
  executionTime: number
}

/**
 * Run code health check
 */
export async function codeHealthCheck(
  input: CodeHealthCheckInput = {}
): Promise<CodeHealthCheckOutput> {
  const startTime = Date.now()

  console.log('🏥 Running Code Health Check...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Run all analyses in parallel
  console.log('⚡ Running code analyses in parallel...')
  const [complexityResult, unusedExportsResult, rerendersResult, stateResult] = await Promise.all([
    analyzeComplexity({}),
    analyzeUnusedExports({}),
    rerendersDetection({ limit: 50 }),
    stateManagementAnalysis({ limit: 50 })
  ])

  console.log('✅ All analyses completed\n')

  // Calculate health scores
  const avgComplexity = complexityResult.files.length > 0
    ? complexityResult.files.reduce((sum, f) => sum + f.avgComplexity, 0) / complexityResult.files.length
    : 0

  // Complexity score: 100 if avg < 5, decreases as complexity increases
  const complexityScore = Math.max(0, Math.min(100, 100 - (avgComplexity - 5) * 10))

  // Dead code score: 100 if no unused exports, decreases based on percentage
  const totalExports = unusedExportsResult.summary.totalExports
  const unusedPercentage = totalExports > 0
    ? (unusedExportsResult.summary.unusedExports / totalExports) * 100
    : 0
  const deadCodeScore = Math.max(0, 100 - unusedPercentage)

  // Performance score: based on rerender issues
  const performanceScore = Math.max(0, 100 - rerendersResult.totalIssues * 2)

  // State management score: based on unused state and patterns
  const unusedStateCount = stateResult.unusedState.length
  const stateScore = Math.max(0, 100 - unusedStateCount * 5)

  const overallScore = Math.round(
    (complexityScore + deadCodeScore + performanceScore + stateScore) / 4
  )

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (overallScore >= 90) grade = 'A'
  else if (overallScore >= 80) grade = 'B'
  else if (overallScore >= 70) grade = 'C'
  else if (overallScore >= 60) grade = 'D'
  else grade = 'F'

  const healthMetrics: CodeHealthMetrics = {
    overall: overallScore,
    complexity: Math.round(complexityScore),
    deadCode: Math.round(deadCodeScore),
    performance: Math.round(performanceScore),
    stateManagement: Math.round(stateScore),
    grade
  }

  // Collect improvements
  const improvements: CodeImprovement[] = []

  // Add complexity improvements
  const highComplexityFiles = complexityResult.files.filter(f => f.avgComplexity > 10)
  if (highComplexityFiles.length > 0) {
    improvements.push({
      category: 'complexity',
      priority: 'high',
      issue: `${highComplexityFiles.length} files with high complexity (>10)`,
      impact: 'Hard to understand and maintain, increases bug risk',
      solution: 'Break down complex functions into smaller, testable units',
      estimatedEffort: 'moderate',
      filesAffected: highComplexityFiles.length
    })
  }

  // Add dead code improvements
  if (unusedExportsResult.summary.unusedExports > 0) {
    improvements.push({
      category: 'dead-code',
      priority: unusedExportsResult.summary.unusedExports > 10 ? 'high' : 'medium',
      issue: `${unusedExportsResult.summary.unusedExports} unused exports detected`,
      impact: 'Increases bundle size and code maintenance burden',
      solution: 'Remove unused exports or make them internal',
      estimatedEffort: 'easy',
      filesAffected: unusedExportsResult.summary.filesWithUnusedExports
    })
  }

  // Add performance improvements
  for (const rerender of rerendersResult.suggestions.slice(0, 5)) {
    improvements.push({
      category: 'performance',
      priority: 'medium',
      issue: rerender.issue,
      impact: rerender.reason,
      solution: rerender.fix,
      estimatedEffort: 'easy',
      filesAffected: 1
    })
  }

  // Add state management improvements
  if (stateResult.unusedState.length > 0) {
    improvements.push({
      category: 'state',
      priority: 'low',
      issue: `${stateResult.unusedState.length} unused state variables`,
      impact: 'Unnecessary re-renders and memory usage',
      solution: 'Remove unused state or add missing setter calls',
      estimatedEffort: 'trivial',
      filesAffected: stateResult.unusedState.length
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Calculate summary
  const filesAnalyzed = new Set([
    ...complexityResult.files.map(f => f.file),
    ...unusedExportsResult.unused.map(u => u.file),
    ...stateResult.unusedState.map(s => s.file)
  ]).size

  const summary = {
    totalIssues: improvements.length,
    highPriorityIssues: improvements.filter(i => i.priority === 'high').length,
    mediumPriorityIssues: improvements.filter(i => i.priority === 'medium').length,
    lowPriorityIssues: improvements.filter(i => i.priority === 'low').length,
    filesAnalyzed
  }

  // Generate quick wins
  const quickWins: string[] = []

  const trivialImprovements = improvements.filter(i => i.estimatedEffort === 'trivial')
  if (trivialImprovements.length > 0) {
    quickWins.push(`⚡ ${trivialImprovements.length} trivial improvements - can be done in minutes`)
  }

  const easyImprovements = improvements.filter(i => i.estimatedEffort === 'easy')
  if (easyImprovements.length > 0) {
    quickWins.push(`🎯 ${easyImprovements.length} easy improvements - low-hanging fruit`)
  }

  if (unusedExportsResult.summary.unusedExports > 0) {
    quickWins.push(`🗑️ Remove ${unusedExportsResult.summary.unusedExports} unused exports to reduce bundle size`)
  }

  if (rerendersResult.totalIssues > 0) {
    quickWins.push(`⚡ Fix ${rerendersResult.totalIssues} rerender issues for better performance`)
  }

  if (overallScore >= 90) {
    quickWins.push('✨ Excellent code health! Keep up the good work.')
  }

  const executionTime = Date.now() - startTime

  const result: CodeHealthCheckOutput = {
    healthMetrics,
    summary,
    improvements,
    detailedResults: {
      complexity: complexityResult,
      unusedExports: unusedExportsResult,
      rerenders: rerendersResult,
      stateManagement: stateResult
    },
    quickWins,
    executionTime
  }

  // Log audit result
  logAuditResult(
    'codeHealthCheck',
    'mcp:code-health-check',
    {
      summary: {
        overallScore,
        grade,
        totalIssues: summary.totalIssues,
        filesAnalyzed: summary.filesAnalyzed,
        executionTime: `${executionTime}ms`,
        quickWins: quickWins.length
      },
      score: grade,
      stats: {
        overall: healthMetrics.overall,
        complexity: healthMetrics.complexity,
        deadCode: healthMetrics.deadCode,
        performance: healthMetrics.performance,
        stateManagement: healthMetrics.stateManagement
      },
      issues: improvements
    },
    executionTime
  )

  return result
}
