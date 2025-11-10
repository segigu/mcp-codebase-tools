import * as fs from 'fs'
import { findFiles, getProjectPath, readFileSafe } from '../../utils/fs-utils.js'
import { extractImports } from '../../utils/ast-utils.js'

/**
 * Renamed file info
 */
export interface RenamedFile {
  file: string
  originalContent: string
  newContent: string
  changes: number
}

/**
 * Input parameters for renameSymbol
 */
export interface RenameSymbolInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Old symbol name */
  oldName: string
  /** New symbol name */
  newName: string
  /** Case sensitive (default: true) */
  caseSensitive?: boolean
  /** Dry run - don't actually write files (default: false) */
  dryRun?: boolean
}

/**
 * Output from renameSymbol
 */
export interface RenameSymbolOutput {
  success: boolean
  filesModified: number
  totalChanges: number
  renamedFiles: RenamedFile[]
  errors: string[]
}

/**
 * Rename a symbol (component, function, variable) across all files
 *
 * This is a simplified implementation using regex replacement.
 * For production use, consider using TypeScript Language Service
 * for accurate rename refactoring.
 *
 * @example
 * ```typescript
 * // Rename Button component to PrimaryButton everywhere
 * const result = await renameSymbol({
 *   pattern: 'src/**\/*.{ts,tsx}',
 *   oldName: 'Button',
 *   newName: 'PrimaryButton',
 *   dryRun: true // Preview changes first
 * })
 *
 * console.log(`Would modify ${result.filesModified} files`)
 * console.log(`Total changes: ${result.totalChanges}`)
 *
 * for (const file of result.renamedFiles) {
 *   console.log(`${file.file}: ${file.changes} changes`)
 * }
 *
 * // If looks good, run without dryRun
 * const actualResult = await renameSymbol({
 *   pattern: 'src/**\/*.{ts,tsx}',
 *   oldName: 'Button',
 *   newName: 'PrimaryButton',
 *   dryRun: false
 * })
 * ```
 */
export async function renameSymbol(input: RenameSymbolInput): Promise<RenameSymbolOutput> {
  const {
    pattern = 'src/**/*.{ts,tsx,js,jsx}',
    exclude,
    oldName,
    newName,
    caseSensitive = true,
    dryRun = false
  } = input

  if (!oldName || !newName) {
    return {
      success: false,
      filesModified: 0,
      totalChanges: 0,
      renamedFiles: [],
      errors: ['oldName and newName are required']
    }
  }

  if (oldName === newName) {
    return {
      success: false,
      filesModified: 0,
      totalChanges: 0,
      renamedFiles: [],
      errors: ['oldName and newName must be different']
    }
  }

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const renamedFiles: RenamedFile[] = []
  const errors: string[] = []
  let totalChanges = 0

  // Create regex for replacing the symbol
  // Use word boundaries to avoid partial matches
  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(`\\b${oldName}\\b`, flags)

  for (const file of files) {
    try {
      const fullPath = getProjectPath(file)
      const originalContent = readFileSafe(fullPath)
      if (!originalContent) continue

      // Check if file contains the old name
      if (!regex.test(originalContent)) continue

      // Reset regex lastIndex
      regex.lastIndex = 0

      // Perform replacement
      const newContent = originalContent.replace(regex, newName)

      // Count changes
      const changes = (originalContent.match(regex) || []).length

      renamedFiles.push({
        file,
        originalContent,
        newContent,
        changes
      })

      totalChanges += changes

      // Write file if not dry run
      if (!dryRun) {
        fs.writeFileSync(fullPath, newContent, 'utf-8')
      }
    } catch (error) {
      errors.push(`Error processing ${file}: ${error}`)
    }
  }

  return {
    success: errors.length === 0,
    filesModified: renamedFiles.length,
    totalChanges,
    renamedFiles,
    errors
  }
}

export type { RenameSymbolInput as Input, RenameSymbolOutput as Output }
