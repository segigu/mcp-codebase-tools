import { sessionManager } from '../../utils/session-manager.js'
import type {
  SessionHealth,
  SessionState
} from '../../utils/session-types.js'

/**
 * Input for session-health command
 */
export interface SessionHealthInput {
  /** Project path */
  projectPath?: string
}

/**
 * Output from session-health command
 */
export interface SessionHealthOutput {
  /** Health metrics */
  health: SessionHealth
  /** Active session state */
  session: SessionState
}

/**
 * Get session health metrics
 *
 * Analyzes current session to determine fragmentation level,
 * duration, and provides recommendations for starting a new session.
 *
 * @example
 * ```typescript
 * const result = await getSessionHealth({})
 *
 * console.log(`Duration: ${result.health.duration} hours`)
 * console.log(`Fragmentation: ${result.health.fragmentation}`)
 * console.log(`Recommendation: ${result.health.recommendation}`)
 *
 * for (const [cat, meta] of Object.entries(result.health.categories)) {
 *   console.log(`${cat}: ${meta.checkpoints} checkpoints, ${meta.commits} commits`)
 * }
 * ```
 */
export async function getSessionHealth(
  input: SessionHealthInput
): Promise<SessionHealthOutput> {
  const { projectPath = process.cwd() } = input

  // Load session
  const session = await sessionManager.loadSession(projectPath)

  // Get health metrics
  const health = await sessionManager.getSessionHealth(projectPath)

  return {
    health,
    session
  }
}

export type { SessionHealthInput as Input, SessionHealthOutput as Output }
