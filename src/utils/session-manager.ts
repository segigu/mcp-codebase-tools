/**
 * Session Context Manager - Core Logic
 *
 * Manages session state, checkpoints, and context detection
 */

import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import crypto from 'crypto'
import type {
  SessionState,
  SessionId,
  Checkpoint,
  CategoryMeta,
  ImportanceLevel,
  CategoryStatus,
  FragmentationLevel,
  SessionHealth,
  SessionSummary,
  ContextCheckResult,
  SessionConfig
} from './session-types.js'

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<SessionConfig> = {
  storageDir: path.join(os.homedir(), '.mcp-session-context'),
  contextSwitchWindow: 4,
  fragmentationThreshold: 3,
  autoCheckpointThreshold: 5
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private config: Required<SessionConfig>

  constructor(config: SessionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get storage paths
   */
  private getPaths() {
    const { storageDir } = this.config
    return {
      root: storageDir,
      active: path.join(storageDir, 'sessions', 'active'),
      archived: path.join(storageDir, 'sessions', 'archived'),
      summaries: path.join(storageDir, 'sessions', 'summaries'),
      current: path.join(storageDir, 'sessions', 'active', 'current.json')
    }
  }

  /**
   * Ensure storage directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const paths = this.getPaths()
    await fs.mkdir(paths.active, { recursive: true })
    await fs.mkdir(paths.archived, { recursive: true })
    await fs.mkdir(paths.summaries, { recursive: true })
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): SessionId {
    const date = new Date().toISOString().split('T')[0]
    const hash = crypto.randomBytes(4).toString('hex')
    return `${date}-session-${hash}`
  }

  /**
   * Generate checkpoint ID
   */
  private generateCheckpointId(): string {
    return `checkpoint-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`
  }

  /**
   * Get current git commit hash
   */
  private getGitCommit(projectPath: string): string | undefined {
    try {
      return execSync('git rev-parse HEAD', {
        cwd: projectPath,
        encoding: 'utf-8'
      }).trim()
    } catch {
      return undefined
    }
  }

  /**
   * Get recently modified files (unstaged + staged)
   */
  private getModifiedFiles(projectPath: string): string[] {
    try {
      const output = execSync('git diff --name-only HEAD', {
        cwd: projectPath,
        encoding: 'utf-8'
      }).trim()
      return output ? output.split('\n') : []
    } catch {
      return []
    }
  }

  /**
   * Get recent commit messages and files
   */
  private getRecentCommits(projectPath: string, count: number): Array<{
    hash: string
    message: string
    files: string[]
  }> {
    try {
      const hashes = execSync(`git log -${count} --format=%H`, {
        cwd: projectPath,
        encoding: 'utf-8'
      }).trim().split('\n')

      return hashes.map(hash => {
        const message = execSync(`git log -1 --format=%s ${hash}`, {
          cwd: projectPath,
          encoding: 'utf-8'
        }).trim()

        const files = execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
          cwd: projectPath,
          encoding: 'utf-8'
        }).trim().split('\n').filter(Boolean)

        return { hash, message, files }
      })
    } catch {
      return []
    }
  }

  /**
   * Auto-detect category from files
   */
  detectCategory(files: string[]): string {
    if (files.length === 0) return 'general'

    // Priority-based detection
    const categoryPatterns = [
      { pattern: /\/(auth|login|oauth|jwt|session)\//, name: 'auth' },
      { pattern: /\/(api|endpoints|routes|controllers)\//, name: 'api' },
      { pattern: /\/(ui|components|views|pages)\//, name: 'ui' },
      { pattern: /\/(utils|helpers|lib)\//, name: 'utils' },
      { pattern: /\/(test|spec|__tests__)\//, name: 'tests' },
      { pattern: /\/(docs|documentation)\//, name: 'docs' },
      { pattern: /\/(config|settings)\//, name: 'config' },
      { pattern: /\/(db|database|models|schema)\//, name: 'database' }
    ]

    // Check file paths
    for (const { pattern, name } of categoryPatterns) {
      if (files.some(f => pattern.test(f))) {
        return name
      }
    }

    // Check file names
    for (const file of files) {
      const basename = path.basename(file, path.extname(file)).toLowerCase()
      if (basename.includes('auth')) return 'auth'
      if (basename.includes('api')) return 'api'
      if (basename.includes('component')) return 'ui'
    }

    // Fallback to directory name
    const firstDir = files[0].split('/')[0]
    return firstDir || 'general'
  }

  /**
   * Calculate importance level for checkpoint
   */
  private calculateImportance(
    todos: string[],
    files: string[],
    status: CategoryStatus,
    explicit?: boolean
  ): ImportanceLevel {
    if (explicit !== undefined) {
      return explicit ? 'high' : 'low'
    }

    let score = 0

    // Has TODO items
    if (todos.length > 0) score += 2

    // Many files changed
    if (files.length > 3) score += 1

    // Work is unfinished
    if (status === 'unfinished') score += 2

    return score >= 2 ? 'high' : 'low'
  }

  /**
   * Calculate fragmentation level
   */
  private calculateFragmentation(categoryCount: number): FragmentationLevel {
    const threshold = this.config.fragmentationThreshold
    if (categoryCount >= threshold) return 'high'
    if (categoryCount === 2) return 'medium'
    return 'low'
  }

  /**
   * Load active session (or create new one)
   */
  async loadSession(projectPath: string): Promise<SessionState> {
    await this.ensureDirectories()
    const paths = this.getPaths()

    try {
      const content = await fs.readFile(paths.current, 'utf-8')
      const session: SessionState = JSON.parse(content)

      // Verify project path matches
      if (session.projectRoot === projectPath) {
        return session
      }
    } catch {
      // File doesn't exist or parse error
    }

    // Create new session
    const session: SessionState = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      projectRoot: projectPath,
      checkpoints: [],
      categories: {},
      initialCommit: this.getGitCommit(projectPath)
    }

    await this.saveSession(session)
    return session
  }

  /**
   * Save active session
   */
  async saveSession(session: SessionState): Promise<void> {
    await this.ensureDirectories()
    const paths = this.getPaths()
    await fs.writeFile(paths.current, JSON.stringify(session, null, 2), 'utf-8')
  }

  /**
   * Create checkpoint
   */
  async createCheckpoint(
    projectPath: string,
    note: string,
    category?: string,
    important?: boolean
  ): Promise<Checkpoint> {
    const session = await this.loadSession(projectPath)

    // Get modified files
    const files = this.getModifiedFiles(projectPath)

    // Detect category if not provided
    const detectedCategory = category || this.detectCategory(files)

    // Get current commit
    const commit = this.getGitCommit(projectPath)

    // Determine status (unfinished if note contains TODO indicators)
    const status: CategoryStatus =
      note.toLowerCase().includes('need') ||
      note.toLowerCase().includes('todo') ||
      note.toLowerCase().includes('wip')
        ? 'unfinished'
        : 'done'

    // Calculate importance
    const importance = this.calculateImportance([], files, status, important)

    // Create checkpoint
    const checkpoint: Checkpoint = {
      id: this.generateCheckpointId(),
      timestamp: new Date().toISOString(),
      category: detectedCategory,
      note,
      commit,
      files,
      importance,
      todos: [],
      status
    }

    // Add to session
    session.checkpoints.push(checkpoint)

    // Update category metadata
    if (!session.categories[detectedCategory]) {
      session.categories[detectedCategory] = {
        importance: 'low',
        status: 'done',
        checkpointCount: 0,
        commitCount: 0,
        files: []
      }
    }

    const catMeta = session.categories[detectedCategory]
    catMeta.checkpointCount++
    if (commit) catMeta.commitCount++
    catMeta.files = [...new Set([...catMeta.files, ...files])]
    catMeta.importance = importance
    catMeta.status = status

    await this.saveSession(session)
    return checkpoint
  }

  /**
   * Add TODO to last checkpoint in category
   */
  async addTodo(
    projectPath: string,
    todo: string,
    category?: string
  ): Promise<{ checkpointId: string; category: string; todos: string[] }> {
    const session = await this.loadSession(projectPath)

    // Find target checkpoint
    let targetCategory = category
    if (!targetCategory) {
      // Use last checkpoint's category
      const lastCheckpoint = session.checkpoints[session.checkpoints.length - 1]
      if (!lastCheckpoint) {
        throw new Error('No checkpoints found. Create a checkpoint first.')
      }
      targetCategory = lastCheckpoint.category
    }

    // Find last checkpoint in this category
    const categoryCheckpoints = session.checkpoints
      .filter(cp => cp.category === targetCategory)

    if (categoryCheckpoints.length === 0) {
      throw new Error(`No checkpoints found for category: ${targetCategory}`)
    }

    const lastCheckpoint = categoryCheckpoints[categoryCheckpoints.length - 1]
    lastCheckpoint.todos.push(todo)
    lastCheckpoint.status = 'unfinished'
    lastCheckpoint.importance = 'high'

    // Update category meta
    if (session.categories[targetCategory]) {
      session.categories[targetCategory].status = 'unfinished'
      session.categories[targetCategory].importance = 'high'
    }

    await this.saveSession(session)

    return {
      checkpointId: lastCheckpoint.id,
      category: targetCategory,
      todos: lastCheckpoint.todos
    }
  }

  /**
   * Get session health metrics
   */
  async getSessionHealth(projectPath: string): Promise<SessionHealth> {
    const session = await this.loadSession(projectPath)

    // Calculate duration
    const startTime = new Date(session.startTime).getTime()
    const now = Date.now()
    const duration = Math.round((now - startTime) / (1000 * 60 * 60) * 10) / 10 // hours

    // Get total commit count
    const commits = this.getRecentCommits(projectPath, 100)
    const sessionCommits = commits.filter(c => {
      const commitTime = this.getCommitTimestamp(projectPath, c.hash)
      return commitTime >= startTime
    })

    // Category count
    const categoryCount = Object.keys(session.categories).length

    // Fragmentation
    const fragmentation = this.calculateFragmentation(categoryCount)

    // Category breakdown
    const categories: SessionHealth['categories'] = {}
    for (const [name, meta] of Object.entries(session.categories)) {
      categories[name] = {
        checkpoints: meta.checkpointCount,
        commits: meta.commitCount,
        importance: meta.importance,
        status: meta.status
      }
    }

    // Generate recommendation
    let recommendation = ''
    if (fragmentation === 'high') {
      recommendation = 'HIGH fragmentation detected. Consider starting new session for next topic.'
    } else if (fragmentation === 'medium') {
      recommendation = 'MEDIUM fragmentation. You can continue, but watch for context switches.'
    } else {
      recommendation = 'LOW fragmentation. Session is focused and manageable.'
    }

    return {
      duration,
      checkpointCount: session.checkpoints.length,
      categoryCount,
      commitCount: sessionCommits.length,
      fragmentation,
      categories,
      recommendation
    }
  }

  /**
   * Get commit timestamp
   */
  private getCommitTimestamp(projectPath: string, hash: string): number {
    try {
      const timestamp = execSync(`git log -1 --format=%ct ${hash}`, {
        cwd: projectPath,
        encoding: 'utf-8'
      }).trim()
      return parseInt(timestamp) * 1000
    } catch {
      return 0
    }
  }

  /**
   * Check for context switch in recent commits
   */
  async checkContextSwitch(projectPath: string): Promise<ContextCheckResult> {
    const window = this.config.contextSwitchWindow
    const commits = this.getRecentCommits(projectPath, window)

    if (commits.length < 2) {
      return {
        switchDetected: false,
        recentCategories: [],
        commitsAnalyzed: commits.length,
        message: 'Not enough commits to detect context switch.'
      }
    }

    // Detect category for each commit
    const categories = commits.map(c => this.detectCategory(c.files))
    const uniqueCategories = [...new Set(categories)]

    const switchDetected = uniqueCategories.length >= 3

    let message = ''
    if (switchDetected) {
      message = `⚠️ Context switch detected.\n\nRecent commits span ${uniqueCategories.length} different categories:\n  • ${uniqueCategories.join(' → ')}\n\n💡 Consider making checkpoint:\n   npm run mcp:checkpoint "Finished ${categories[0]} work"\n\nThis helps preserve context for future sessions.`
    } else {
      message = '✅ No significant context switch detected.'
    }

    return {
      switchDetected,
      recentCategories: categories,
      commitsAnalyzed: commits.length,
      message
    }
  }

  /**
   * Generate session summary and archive
   */
  async createSummary(projectPath: string): Promise<SessionSummary> {
    const session = await this.loadSession(projectPath)
    const endTime = new Date().toISOString()

    // Group checkpoints by category
    const categoryGroups: Record<string, Checkpoint[]> = {}
    for (const checkpoint of session.checkpoints) {
      if (!categoryGroups[checkpoint.category]) {
        categoryGroups[checkpoint.category] = []
      }
      categoryGroups[checkpoint.category].push(checkpoint)
    }

    // Build category summaries
    const categories = Object.entries(categoryGroups).map(([name, checkpoints]) => {
      const meta = session.categories[name]

      // Collect done items and todos
      const done: string[] = []
      const todos: string[] = []
      const files = new Set<string>()
      const commits = new Set<string>()

      for (const cp of checkpoints) {
        if (cp.status === 'done' || cp.todos.length === 0) {
          done.push(cp.note)
        }
        for (const todo of cp.todos) {
          todos.push(todo)
        }
        for (const file of cp.files) {
          files.add(file)
        }
        if (cp.commit) {
          commits.add(cp.commit)
        }
      }

      return {
        name,
        importance: meta.importance,
        status: meta.status,
        done,
        todos,
        files: Array.from(files),
        commits: Array.from(commits)
      }
    })

    // Calculate stats
    const stats = {
      totalCheckpoints: session.checkpoints.length,
      totalCommits: Object.values(session.categories).reduce((sum, c) => sum + c.commitCount, 0),
      totalFiles: new Set(session.checkpoints.flatMap(cp => cp.files)).size,
      duration: Math.round((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10
    }

    const summary: SessionSummary = {
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime,
      projectRoot: session.projectRoot,
      categories,
      stats
    }

    // Archive session
    await this.archiveSession(session, summary)

    return summary
  }

  /**
   * Archive session
   */
  private async archiveSession(session: SessionState, summary: SessionSummary): Promise<void> {
    const paths = this.getPaths()

    // Save to archived
    const archivePath = path.join(paths.archived, `${session.sessionId}.json`)
    await fs.writeFile(archivePath, JSON.stringify(session, null, 2), 'utf-8')

    // Save summary markdown
    const markdown = this.generateSummaryMarkdown(summary)
    const summaryPath = path.join(paths.summaries, `${session.sessionId}.md`)
    await fs.writeFile(summaryPath, markdown, 'utf-8')

    // Clear active session
    try {
      await fs.unlink(paths.current)
    } catch {
      // Ignore if doesn't exist
    }
  }

  /**
   * Generate summary markdown
   */
  private generateSummaryMarkdown(summary: SessionSummary): string {
    const { sessionId, startTime, endTime, categories, stats } = summary

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    let md = `# Session Summary: ${sessionId}\n\n`
    md += `**Duration:** ${stats.duration} hours (${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()})\n`
    md += `**Date:** ${startDate.toLocaleDateString()}\n\n`
    md += `---\n\n`

    // Sort categories by importance
    const sorted = [...categories].sort((a, b) => {
      if (a.importance === 'high' && b.importance === 'low') return -1
      if (a.importance === 'low' && b.importance === 'high') return 1
      return 0
    })

    for (const cat of sorted) {
      const icon = cat.importance === 'high' ? '🔴' : '🟢'
      const statusText = cat.status === 'unfinished' ? ' (UNFINISHED)' : ''

      md += `## ${icon} ${cat.name}${statusText}\n\n`

      if (cat.done.length > 0) {
        md += `### ✅ Done:\n`
        for (const item of cat.done) {
          md += `- ${item}\n`
        }
        md += `\n`
      }

      if (cat.todos.length > 0) {
        md += `### ⏹️ TODO:\n`
        for (const item of cat.todos) {
          md += `- ${item}\n`
        }
        md += `\n`
      }

      md += `**📁 Files:** ${cat.files.length} files\n`
      md += `**🔗 Commits:** ${cat.commits.length} commits\n`
      md += `\n---\n\n`
    }

    md += `## 📊 Statistics\n\n`
    md += `- **Total Checkpoints:** ${stats.totalCheckpoints}\n`
    md += `- **Total Commits:** ${stats.totalCommits}\n`
    md += `- **Total Files Modified:** ${stats.totalFiles}\n`
    md += `- **Session Duration:** ${stats.duration} hours\n`

    return md
  }

  /**
   * Get last session summary
   */
  async getLastSummary(): Promise<SessionSummary | null> {
    const paths = this.getPaths()

    try {
      const files = await fs.readdir(paths.archived)
      if (files.length === 0) return null

      // Get most recent
      const sorted = files.sort().reverse()
      const lastFile = path.join(paths.archived, sorted[0])

      const content = await fs.readFile(lastFile, 'utf-8')
      const session: SessionState = JSON.parse(content)

      // Reconstruct summary
      return this.createSummary(session.projectRoot)
    } catch {
      return null
    }
  }
}

/**
 * Default session manager instance
 */
export const sessionManager = new SessionManager()
