import { findFiles, getProjectPath } from '../../utils/fs-utils.js'
import { extractTypes, type TypeInfo } from '../../utils/ast-utils.js'

/**
 * Type match result
 */
export interface TypeMatch {
  file: string
  type: TypeInfo
}

/**
 * Input parameters for findTypes
 */
export interface FindTypesInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Type name to search for (optional, returns all if not specified) */
  name?: string
  /** Type kind filter */
  typeKind?: 'interface' | 'type' | 'enum' | 'class'
  /** Only include exported types */
  exportedOnly?: boolean
}

/**
 * Output from findTypes
 */
export interface FindTypesOutput {
  matches: TypeMatch[]
  totalTypes: number
  totalFiles: number
  typesByKind: Record<string, number>
}

/**
 * Find TypeScript type definitions in the codebase
 *
 * @example
 * ```typescript
 * // Find all type definitions
 * const allTypes = await findTypes({
 *   pattern: 'src/**\/*.{ts,tsx}'
 * })
 *
 * // Find specific type
 * const userType = await findTypes({
 *   pattern: 'src/**\/*.ts',
 *   name: 'User'
 * })
 *
 * // Find all exported interfaces
 * const interfaces = await findTypes({
 *   pattern: 'src/**\/*.ts',
 *   typeKind: 'interface',
 *   exportedOnly: true
 * })
 *
 * console.log(`Found ${allTypes.totalTypes} type definitions`)
 * console.log('By kind:', allTypes.typesByKind)
 *
 * for (const match of userType.matches) {
 *   console.log(`${match.file}:${match.type.line} - ${match.type.name} (${match.type.type})`)
 * }
 * ```
 */
export async function findTypes(input: FindTypesInput = {}): Promise<FindTypesOutput> {
  const { pattern = 'src/**/*.{ts,tsx}', exclude, name, typeKind, exportedOnly = false } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const matches: TypeMatch[] = []
  const filesWithTypes = new Set<string>()
  const typesByKind: Record<string, number> = {}

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const types = extractTypes(fullPath)

    for (const type of types) {
      // Apply filters
      if (name && type.name !== name) continue
      if (typeKind && type.type !== typeKind) continue
      if (exportedOnly && !type.isExported) continue

      matches.push({
        file,
        type
      })

      filesWithTypes.add(file)

      // Count by kind
      typesByKind[type.type] = (typesByKind[type.type] || 0) + 1
    }
  }

  // Sort by file, then by line
  matches.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    return a.type.line - b.type.line
  })

  return {
    matches,
    totalTypes: matches.length,
    totalFiles: filesWithTypes.size,
    typesByKind
  }
}

export type { FindTypesInput as Input, FindTypesOutput as Output }
