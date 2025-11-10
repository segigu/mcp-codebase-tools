import * as fs from 'fs'
import * as path from 'path'
import glob from 'fast-glob'

/**
 * File information
 */
export interface FileInfo {
  path: string
  name: string
  extension: string
  size: number
  lines: number
  isDirectory: boolean
}

/**
 * Project root directory
 */
export const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.cwd(), process.env.PROJECT_ROOT)
  : path.resolve(process.cwd(), '..')

/**
 * Default exclude patterns
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  '.cache'
]

/**
 * Get absolute path relative to project root
 */
export function getProjectPath(...segments: string[]): string {
  return path.join(PROJECT_ROOT, ...segments)
}

/**
 * Check if path should be excluded
 */
export function shouldExclude(filePath: string, excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS): boolean {
  return excludePatterns.some(pattern => filePath.includes(pattern))
}

/**
 * Read file content safely
 */
export function readFileSafe(filePath: string): string | null {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : getProjectPath(filePath)

    if (!fs.existsSync(absolutePath)) {
      return null
    }

    const stats = fs.statSync(absolutePath)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '1048576', 10) // 1MB default

    if (stats.size > maxSize) {
      console.warn(`File too large: ${filePath} (${stats.size} bytes)`)
      return null
    }

    return fs.readFileSync(absolutePath, 'utf-8')
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return null
  }
}

/**
 * Get file information
 */
export function getFileInfo(filePath: string): FileInfo | null {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : getProjectPath(filePath)

    if (!fs.existsSync(absolutePath)) {
      return null
    }

    const stats = fs.statSync(absolutePath)
    const content = stats.isDirectory() ? '' : readFileSafe(absolutePath) || ''

    return {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      size: stats.size,
      lines: content ? content.split('\n').length : 0,
      isDirectory: stats.isDirectory()
    }
  } catch (error) {
    console.error(`Error getting file info ${filePath}:`, error)
    return null
  }
}

/**
 * Find files by glob pattern
 */
export function findFiles(
  pattern: string | string[],
  options: {
    cwd?: string
    ignore?: string[]
    absolute?: boolean
  } = {}
): string[] {
  const cwd = options.cwd ? getProjectPath(options.cwd) : PROJECT_ROOT
  const ignore = options.ignore || DEFAULT_EXCLUDE_PATTERNS

  try {
    return glob.sync(pattern, {
      cwd,
      ignore,
      absolute: options.absolute ?? false,
      onlyFiles: true
    })
  } catch (error) {
    console.error(`Error finding files with pattern ${pattern}:`, error)
    return []
  }
}

/**
 * Find directories by glob pattern
 */
export function findDirectories(
  pattern: string | string[],
  options: {
    cwd?: string
    ignore?: string[]
    absolute?: boolean
  } = {}
): string[] {
  const cwd = options.cwd ? getProjectPath(options.cwd) : PROJECT_ROOT
  const ignore = options.ignore || DEFAULT_EXCLUDE_PATTERNS

  try {
    return glob.sync(pattern, {
      cwd,
      ignore,
      absolute: options.absolute ?? false,
      onlyDirectories: true
    })
  } catch (error) {
    console.error(`Error finding directories with pattern ${pattern}:`, error)
    return []
  }
}

/**
 * Get all files in directory recursively
 */
export function getAllFiles(
  directory: string,
  options: {
    extensions?: string[]
    exclude?: string[]
  } = {}
): string[] {
  const dir = path.isAbsolute(directory) ? directory : getProjectPath(directory)
  const extensions = options.extensions || []
  const exclude = options.exclude || DEFAULT_EXCLUDE_PATTERNS

  const pattern = extensions.length > 0
    ? `**/*.{${extensions.join(',')}}`
    : '**/*'

  return findFiles(pattern, {
    cwd: dir,
    ignore: exclude
  })
}

/**
 * Count lines in file
 */
export function countLines(filePath: string): number {
  const content = readFileSafe(filePath)
  return content ? content.split('\n').length : 0
}

/**
 * Count total lines in multiple files
 */
export function countTotalLines(files: string[]): number {
  return files.reduce((total, file) => total + countLines(file), 0)
}

/**
 * Get file extension statistics
 */
export function getExtensionStats(files: string[]): Record<string, number> {
  const stats: Record<string, number> = {}

  for (const file of files) {
    const ext = path.extname(file) || 'no-extension'
    stats[ext] = (stats[ext] || 0) + 1
  }

  return stats
}
