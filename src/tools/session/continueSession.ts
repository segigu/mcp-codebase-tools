import { sessionManager } from '../../utils/session-manager.js'
import type {
  SessionSummary,
  ImportanceLevel
} from '../../utils/session-types.js'

/**
 * Input for session-continue command
 */
export interface SessionContinueInput {
  /** Filter by specific category */
  category?: string
  /** Project path */
  projectPath?: string
  /** Show last N sessions (default: 1) */
  count?: number
}

/**
 * Output from session-continue command
 */
export interface SessionContinueOutput {
  /** Last session summary */
  lastSession: SessionSummary
  /** Unfinished work from last session */
  unfinished: {
    category: string
    importance: ImportanceLevel
    done: string[]
    todos: string[]
    files: string[]
  }[]
  /** How long ago last session ended */
  hoursAgo: number
}

/**
 * Continue from last session
 *
 * Shows the last session summary, filtering for unfinished work
 * and high-priority items. Useful for picking up where you left off.
 *
 * @example
 * ```typescript
 * const result = await continueSession({
 *   category: "auth" // optional filter
 * })
 *
 * console.log(`Last session ended ${result.hoursAgo} hours ago`)
 *
 * for (const item of result.unfinished) {
 *   console.log(`\n[${item.category}]`)
 *   console.log(`Done: ${item.done.join(', ')}`)
 *   console.log(`TODOs: ${item.todos.join(', ')}`)
 *   console.log(`Files: ${item.files.join(', ')}`)
 * }
 * ```
 */
export async function continueSession(
  input: SessionContinueInput
): Promise<SessionContinueOutput> {
  const {
    category,
    projectPath = process.cwd(),
    count = 1
  } = input

  // Get last session summary
  const lastSession = await sessionManager.getLastSummary()

  if (!lastSession) {
    throw new Error('No previous session found')
  }

  // Calculate hours ago
  const endTime = new Date(lastSession.endTime).getTime()
  const now = Date.now()
  const hoursAgo = Math.round((now - endTime) / (1000 * 60 * 60) * 10) / 10

  // Filter for unfinished work
  let unfinished = lastSession.categories
    .filter(cat => cat.status === 'unfinished' || cat.importance === 'high')

  // Apply category filter if provided
  if (category) {
    unfinished = unfinished.filter(cat => cat.name === category)
  }

  // Map to simpler format
  const unfinishedItems = unfinished.map(cat => ({
    category: cat.name,
    importance: cat.importance,
    done: cat.done,
    todos: cat.todos,
    files: cat.files
  }))

  return {
    lastSession,
    unfinished: unfinishedItems,
    hoursAgo
  }
}

export type { SessionContinueInput as Input, SessionContinueOutput as Output }
