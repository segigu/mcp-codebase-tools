import * as fs from 'fs'
import * as path from 'path'
import { getProjectPath, shouldExclude, DEFAULT_EXCLUDE_PATTERNS } from '../../utils/fs-utils.js'

/**
 * Directory tree node
 */
export interface DirectoryNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  extension?: string
  children?: DirectoryNode[]
}

/**
 * Project structure statistics
 */
export interface ProjectStructureStats {
  totalFiles: number
  totalDirectories: number
  totalSize: number
  filesByExtension: Record<string, number>
  largestFiles: Array<{ path: string; size: number }>
}

/**
 * Input parameters for getProjectStructure
 */
export interface GetProjectStructureInput {
  /** Starting directory (relative to project root) */
  directory?: string
  /** Maximum depth to traverse (default: 5) */
  maxDepth?: number
  /** Patterns to exclude (default: node_modules, dist, etc.) */
  exclude?: string[]
  /** Include statistics (default: true) */
  includeStats?: boolean
}

/**
 * Output from getProjectStructure
 */
export interface GetProjectStructureOutput {
  tree: DirectoryNode
  stats?: ProjectStructureStats
}

/**
 * Get project directory structure as a tree
 *
 * @example
 * ```typescript
 * const structure = await getProjectStructure({
 *   directory: 'src',
 *   maxDepth: 3,
 *   exclude: ['node_modules', 'dist']
 * })
 *
 * console.log(structure.stats?.totalFiles) // 142
 * console.log(structure.tree) // Directory tree
 * ```
 */
export async function getProjectStructure(
  input: GetProjectStructureInput = {}
): Promise<GetProjectStructureOutput> {
  const {
    directory = '.',
    maxDepth = 5,
    exclude = DEFAULT_EXCLUDE_PATTERNS,
    includeStats = true
  } = input

  const startPath = getProjectPath(directory)

  // Stats tracking
  const stats: ProjectStructureStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    filesByExtension: {},
    largestFiles: []
  }

  /**
   * Build directory tree recursively
   */
  function buildTree(dirPath: string, depth: number): DirectoryNode | null {
    if (depth > maxDepth) return null
    if (shouldExclude(dirPath, exclude)) return null

    try {
      const stat = fs.statSync(dirPath)
      const name = path.basename(dirPath)
      const relativePath = path.relative(startPath, dirPath) || '.'

      if (stat.isFile()) {
        stats.totalFiles++
        stats.totalSize += stat.size

        const ext = path.extname(dirPath) || 'no-extension'
        stats.filesByExtension[ext] = (stats.filesByExtension[ext] || 0) + 1

        // Track largest files
        stats.largestFiles.push({ path: relativePath, size: stat.size })
        if (stats.largestFiles.length > 10) {
          stats.largestFiles.sort((a, b) => b.size - a.size)
          stats.largestFiles = stats.largestFiles.slice(0, 10)
        }

        return {
          name,
          path: relativePath,
          type: 'file',
          size: stat.size,
          extension: ext
        }
      } else if (stat.isDirectory()) {
        stats.totalDirectories++

        const children: DirectoryNode[] = []
        const entries = fs.readdirSync(dirPath)

        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry)
          const childNode = buildTree(entryPath, depth + 1)
          if (childNode) {
            children.push(childNode)
          }
        }

        // Sort children: directories first, then files
        children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })

        return {
          name,
          path: relativePath,
          type: 'directory',
          children: children.length > 0 ? children : undefined
        }
      }
    } catch (error) {
      console.error(`Error processing ${dirPath}:`, error)
    }

    return null
  }

  const tree = buildTree(startPath, 0)

  if (!tree) {
    throw new Error(`Failed to build tree for ${startPath}`)
  }

  return {
    tree,
    ...(includeStats ? { stats } : {})
  }
}

export type { GetProjectStructureInput as Input, GetProjectStructureOutput as Output }
