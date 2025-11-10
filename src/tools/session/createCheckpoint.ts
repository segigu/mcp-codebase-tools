import { sessionManager } from '../../utils/session-manager.js'
import type { Checkpoint } from '../../utils/session-types.js'

/**
 * Input for checkpoint command
 */
export interface CreateCheckpointInput {
  /** Brief note about what was done */
  note: string
  /** Category (auto-detected if not provided) */
  category?: string
  /** Explicitly set importance */
  important?: boolean
  /** Project path */
  projectPath?: string
}

/**
 * Output from checkpoint command
 */
export interface CreateCheckpointOutput {
  /** Created checkpoint */
  checkpoint: Checkpoint
  /** Auto-detected category */
  detectedCategory: string
  /** Files in this checkpoint */
  files: string[]
  /** Git commit hash */
  commit?: string
}

/**
 * Create a checkpoint in the current session
 *
 * Saves current progress with a brief note. Automatically detects
 * category from modified files and associates with git commit.
 *
 * @example
 * ```typescript
 * const result = await createCheckpoint({
 *   note: "Fixed login form validation",
 *   important: true
 * })
 *
 * console.log(`Checkpoint created in category: ${result.detectedCategory}`)
 * console.log(`Files: ${result.files.join(', ')}`)
 * ```
 */
export async function createCheckpoint(
  input: CreateCheckpointInput
): Promise<CreateCheckpointOutput> {
  const {
    note,
    category,
    important,
    projectPath = process.cwd()
  } = input

  if (!note || note.trim().length === 0) {
    throw new Error('Note is required for checkpoint')
  }

  // Create checkpoint
  const checkpoint = await sessionManager.createCheckpoint(
    projectPath,
    note,
    category,
    important
  )

  return {
    checkpoint,
    detectedCategory: checkpoint.category,
    files: checkpoint.files,
    commit: checkpoint.commit
  }
}

export type { CreateCheckpointInput as Input, CreateCheckpointOutput as Output }
