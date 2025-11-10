import * as fs from 'fs'
import { findFiles, getProjectPath, readFileSafe } from '../../utils/fs-utils.js'

/**
 * Updated import info
 */
export interface UpdatedImport {
  file: string
  originalImport: string
  newImport: string
  line: number
}

/**
 * Input parameters for updateImports
 */
export interface UpdateImportsInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Old import path */
  oldPath: string
  /** New import path */
  newPath: string
  /** Dry run - don't actually write files (default: false) */
  dryRun?: boolean
}

/**
 * Output from updateImports
 */
export interface UpdateImportsOutput {
  success: boolean
  filesModified: number
  totalChanges: number
  updatedImports: UpdatedImport[]
  errors: string[]
}

/**
 * Update import paths across all files
 *
 * Useful when moving files or changing module structure.
 *
 * @example
 * ```typescript
 * // Update imports after moving Button component
 * const result = await updateImports({
 *   pattern: 'src/**\/*.tsx',
 *   oldPath: '@/components/Button',
 *   newPath: '@/components/ui/button',
 *   dryRun: true // Preview changes first
 * })
 *
 * console.log(`Would modify ${result.filesModified} files`)
 *
 * for (const imp of result.updatedImports) {
 *   console.log(`${imp.file}:${imp.line}`)
 *   console.log(`  Old: ${imp.originalImport}`)
 *   console.log(`  New: ${imp.newImport}`)
 * }
 *
 * // If looks good, run without dryRun
 * const actualResult = await updateImports({
 *   pattern: 'src/**\/*.tsx',
 *   oldPath: '@/components/Button',
 *   newPath: '@/components/ui/button',
 *   dryRun: false
 * })
 * ```
 */
export async function updateImports(input: UpdateImportsInput): Promise<UpdateImportsOutput> {
  const { pattern = 'src/**/*.{ts,tsx,js,jsx}', exclude, oldPath, newPath, dryRun = false } = input

  if (!oldPath || !newPath) {
    return {
      success: false,
      filesModified: 0,
      totalChanges: 0,
      updatedImports: [],
      errors: ['oldPath and newPath are required']
    }
  }

  if (oldPath === newPath) {
    return {
      success: false,
      filesModified: 0,
      totalChanges: 0,
      updatedImports: [],
      errors: ['oldPath and newPath must be different']
    }
  }

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const updatedImports: UpdatedImport[] = []
  const errors: string[] = []
  const fileChanges = new Map<string, string>()

  // Regex to match import statements with the old path
  // Handles: import X from 'path', import { X } from 'path', import * as X from 'path'
  const importRegex = new RegExp(
    `(import\\s+(?:(?:\\{[^}]+\\})|(?:[^\\s]+)|(?:\\*\\s+as\\s+[^\\s]+))\\s+from\\s+['"])${oldPath.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )}(['"])`,
    'g'
  )

  for (const file of files) {
    try {
      const fullPath = getProjectPath(file)
      const originalContent = readFileSafe(fullPath)
      if (!originalContent) continue

      // Check if file contains imports with old path
      if (!importRegex.test(originalContent)) continue

      // Reset regex lastIndex
      importRegex.lastIndex = 0

      let newContent = originalContent
      const lines = originalContent.split('\n')
      let hasChanges = false

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (importRegex.test(line)) {
          importRegex.lastIndex = 0
          const newLine = line.replace(importRegex, `$1${newPath}$2`)

          if (newLine !== line) {
            updatedImports.push({
              file,
              originalImport: line.trim(),
              newImport: newLine.trim(),
              line: i + 1
            })

            lines[i] = newLine
            hasChanges = true
          }
        }
      }

      if (hasChanges) {
        newContent = lines.join('\n')
        fileChanges.set(file, newContent)
      }
    } catch (error) {
      errors.push(`Error processing ${file}: ${error}`)
    }
  }

  // Write files if not dry run
  if (!dryRun) {
    for (const [file, content] of fileChanges.entries()) {
      try {
        const fullPath = getProjectPath(file)
        fs.writeFileSync(fullPath, content, 'utf-8')
      } catch (error) {
        errors.push(`Error writing ${file}: ${error}`)
      }
    }
  }

  return {
    success: errors.length === 0,
    filesModified: fileChanges.size,
    totalChanges: updatedImports.length,
    updatedImports,
    errors
  }
}

export type { UpdateImportsInput as Input, UpdateImportsOutput as Output }
