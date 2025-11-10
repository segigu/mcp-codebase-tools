import { sessionManager } from '../../utils/session-manager.js'
import type {
  ContextCheckResult,
  SessionState
} from '../../utils/session-types.js'

/**
 * Input for context-check command
 */
export interface ContextCheckInput {
  /** Number of recent commits to check (default: 4) */
  recentCommits?: number
  /** Project path */
  projectPath?: string
}

/**
 * Output from context-check command
 */
export interface ContextCheckOutput {
  /** Check result */
  result: ContextCheckResult
  /** Current session state (if exists) */
  session?: SessionState
}

/**
 * Check for context switches in recent commits
 *
 * Analyzes recent git commits to detect if you've been switching
 * between different modules/categories. Useful as a pre-commit hook
 * to remind you to create checkpoints.
 *
 * @example
 * ```typescript
 * const result = await checkContext({
 *   recentCommits: 4
 * })
 *
 * if (result.result.switchDetected) {
 *   console.log(result.result.message)
 *   // ⚠️ Context switch detected.
 *   // Recent commits span 3 different categories: auth → ui → api
 *   // 💡 Consider making checkpoint: npm run mcp:checkpoint "Finished auth work"
 * }
 * ```
 */
export async function checkContext(
  input: ContextCheckInput
): Promise<ContextCheckOutput> {
  const {
    recentCommits = 4,
    projectPath = process.cwd()
  } = input

  // Check for context switch
  const result = await sessionManager.checkContextSwitch(projectPath)

  // Try to load current session (may not exist)
  let session
  try {
    session = await sessionManager.loadSession(projectPath)
  } catch {
    session = undefined
  }

  return {
    result,
    session
  }
}

export type { ContextCheckInput as Input, ContextCheckOutput as Output }
