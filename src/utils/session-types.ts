/**
 * Session Context Manager - Core Types
 *
 * Types for managing Claude Code session context and checkpoints
 */

/**
 * Session ID format: YYYY-MM-DD-session-N
 */
export type SessionId = string

/**
 * Category importance level
 */
export type ImportanceLevel = 'high' | 'low'

/**
 * Category status
 */
export type CategoryStatus = 'done' | 'unfinished'

/**
 * Context fragmentation level
 */
export type FragmentationLevel = 'low' | 'medium' | 'high'

/**
 * Individual checkpoint within a session
 */
export interface Checkpoint {
  /** Unique checkpoint ID */
  id: string
  /** Timestamp when checkpoint was created */
  timestamp: string
  /** Category/module this checkpoint belongs to */
  category: string
  /** Brief note about what was done (1-2 sentences) */
  note: string
  /** Git commit hash associated with this checkpoint */
  commit?: string
  /** Files modified in this checkpoint */
  files: string[]
  /** Importance level (auto-calculated or user-specified) */
  importance: ImportanceLevel
  /** TODO items associated with this checkpoint */
  todos: string[]
  /** Whether this checkpoint represents finished work */
  status: CategoryStatus
}

/**
 * Category metadata within a session
 */
export interface CategoryMeta {
  /** Importance level (high if has unfinished todos) */
  importance: ImportanceLevel
  /** Whether category work is complete */
  status: CategoryStatus
  /** Number of checkpoints in this category */
  checkpointCount: number
  /** Number of commits in this category */
  commitCount: number
  /** Files touched in this category */
  files: string[]
}

/**
 * Active session state
 */
export interface SessionState {
  /** Unique session ID */
  sessionId: SessionId
  /** When session started */
  startTime: string
  /** Project root path */
  projectRoot: string
  /** All checkpoints in this session */
  checkpoints: Checkpoint[]
  /** Metadata per category */
  categories: Record<string, CategoryMeta>
  /** Last git commit at session start */
  initialCommit?: string
}

/**
 * Session health metrics
 */
export interface SessionHealth {
  /** Session duration in hours */
  duration: number
  /** Total number of checkpoints */
  checkpointCount: number
  /** Number of different categories */
  categoryCount: number
  /** Total git commits during session */
  commitCount: number
  /** Context fragmentation level */
  fragmentation: FragmentationLevel
  /** Category breakdown */
  categories: Record<string, {
    checkpoints: number
    commits: number
    importance: ImportanceLevel
    status: CategoryStatus
  }>
  /** Recommendation text */
  recommendation: string
}

/**
 * Session summary for archival
 */
export interface SessionSummary {
  /** Session ID */
  sessionId: SessionId
  /** Start and end times */
  startTime: string
  endTime: string
  /** Project root */
  projectRoot: string
  /** Summary by category */
  categories: {
    name: string
    importance: ImportanceLevel
    status: CategoryStatus
    done: string[]
    todos: string[]
    files: string[]
    commits: string[]
  }[]
  /** Total stats */
  stats: {
    totalCheckpoints: number
    totalCommits: number
    totalFiles: number
    duration: number
  }
}

/**
 * Context check result (for git hook)
 */
export interface ContextCheckResult {
  /** Whether context switch was detected */
  switchDetected: boolean
  /** Recent commit categories */
  recentCategories: string[]
  /** Number of recent commits analyzed */
  commitsAnalyzed: number
  /** Suggestion message */
  message: string
}

/**
 * Configuration for session manager
 */
export interface SessionConfig {
  /** Where to store session data (default: ~/.mcp-session-context) */
  storageDir?: string
  /** Number of recent commits to analyze for context switch (default: 4) */
  contextSwitchWindow?: number
  /** Threshold for high fragmentation (default: 3 categories) */
  fragmentationThreshold?: number
  /** Auto-checkpoint after N commits without manual checkpoint (default: 5) */
  autoCheckpointThreshold?: number
}

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
 * Input for session-todo command
 */
export interface AddTodoInput {
  /** TODO text */
  todo: string
  /** Category (uses last checkpoint category if not provided) */
  category?: string
  /** Project path */
  projectPath?: string
}

/**
 * Output from session-todo command
 */
export interface AddTodoOutput {
  /** TODO was added to this checkpoint */
  checkpointId: string
  /** Category */
  category: string
  /** All TODOs in this category */
  todos: string[]
}

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
