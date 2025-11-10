import { sessionManager } from '../../utils/session-manager.js'
import path from 'path'
import { promises as fs } from 'fs'
import type { SessionSummary } from '../../utils/session-types.js'

/**
 * Input for session-summary command
 */
export interface SessionSummaryInput {
  /** Project path */
  projectPath?: string
  /** Custom output path for markdown */
  outputPath?: string
}

/**
 * Output from session-summary command
 */
export interface SessionSummaryOutput {
  /** Summary object */
  summary: SessionSummary
  /** Path where markdown was saved */
  markdownPath: string
  /** Markdown content */
  markdown: string
}

/**
 * Create session summary and archive
 *
 * Generates a structured markdown summary of the current session,
 * archives the session data, and clears the active session.
 *
 * @example
 * ```typescript
 * const result = await createSessionSummary({})
 *
 * console.log(`Summary saved to: ${result.markdownPath}`)
 * console.log(`Session duration: ${result.summary.stats.duration} hours`)
 * console.log(`Total checkpoints: ${result.summary.stats.totalCheckpoints}`)
 *
 * for (const cat of result.summary.categories) {
 *   console.log(`\n${cat.name} (${cat.status}):`)
 *   console.log(`  Done: ${cat.done.length}`)
 *   console.log(`  TODOs: ${cat.todos.length}`)
 * }
 * ```
 */
export async function createSessionSummary(
  input: SessionSummaryInput
): Promise<SessionSummaryOutput> {
  const {
    projectPath = process.cwd(),
    outputPath
  } = input

  // Create summary
  const summary = await sessionManager.createSummary(projectPath)

  // Generate markdown
  const markdown = generateMarkdown(summary)

  // Determine output path
  let markdownPath: string
  if (outputPath) {
    markdownPath = path.resolve(outputPath)
  } else {
    // Default to docs/sessions/by-date/
    const docsDir = path.join(projectPath, 'docs', 'sessions', 'by-date')
    await fs.mkdir(docsDir, { recursive: true })
    const date = new Date(summary.startTime).toISOString().split('T')[0]
    markdownPath = path.join(docsDir, `${date}-${summary.sessionId}.md`)
  }

  // Save markdown
  await fs.writeFile(markdownPath, markdown, 'utf-8')

  return {
    summary,
    markdownPath,
    markdown
  }
}

/**
 * Generate markdown for summary
 */
function generateMarkdown(summary: import('../../utils/session-types.js').SessionSummary): string {
  const { sessionId, startTime, endTime, categories, stats } = summary

  const startDate = new Date(startTime)
  const endDate = new Date(endTime)

  let md = `# Session Summary: ${startDate.toLocaleDateString()}\n\n`
  md += `**Session ID:** \`${sessionId}\`\n`
  md += `**Duration:** ${stats.duration} hours (${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()})\n\n`
  md += `---\n\n`

  // Sort categories: high priority first, then unfinished
  const sorted = [...categories].sort((a, b) => {
    if (a.importance === 'high' && b.importance === 'low') return -1
    if (a.importance === 'low' && b.importance === 'high') return 1
    if (a.status === 'unfinished' && b.status === 'done') return -1
    if (a.status === 'done' && b.status === 'unfinished') return 1
    return 0
  })

  for (const cat of sorted) {
    const priorityLabel = cat.importance === 'high' ? 'HIGH priority' : 'LOW priority'
    const statusLabel = cat.status === 'unfinished' ? ' - unfinished' : ''

    md += `## ${cat.name} (${priorityLabel}${statusLabel})\n\n`

    if (cat.done.length > 0) {
      md += `✅ **Done:**\n`
      for (const item of cat.done) {
        md += `- ${item}\n`
      }
      md += `\n`
    }

    if (cat.todos.length > 0) {
      md += `⏹️ **TODO:**\n`
      for (const item of cat.todos) {
        md += `- ${item}\n`
      }
      md += `\n`
    }

    if (cat.files.length > 0) {
      md += `📁 **Files:** ${cat.files.slice(0, 5).join(', ')}`
      if (cat.files.length > 5) {
        md += `, ... (${cat.files.length} total)`
      }
      md += `\n`
    }

    md += `🔗 **Commits:** ${cat.commits.length}\n`
    md += `\n---\n\n`
  }

  md += `## 📊 Statistics\n\n`
  md += `- Total Checkpoints: ${stats.totalCheckpoints}\n`
  md += `- Total Commits: ${stats.totalCommits}\n`
  md += `- Total Files Modified: ${stats.totalFiles}\n`
  md += `- Session Duration: ${stats.duration} hours\n`

  return md
}

export type { SessionSummaryInput as Input, SessionSummaryOutput as Output }
