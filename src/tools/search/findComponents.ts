import { findFiles, getProjectPath } from '../../utils/fs-utils.js'
import { extractComponents, type ComponentInfo } from '../../utils/ast-utils.js'

/**
 * Component match result
 */
export interface ComponentMatch {
  file: string
  component: ComponentInfo
}

/**
 * Input parameters for findComponents
 */
export interface FindComponentsInput {
  /** Glob pattern for files to search */
  pattern?: string
  /** Patterns to exclude */
  exclude?: string[]
  /** Component name to search for (optional, returns all if not specified) */
  name?: string
  /** Component type filter */
  type?: 'function' | 'class' | 'arrow'
  /** Only include exported components */
  exportedOnly?: boolean
}

/**
 * Output from findComponents
 */
export interface FindComponentsOutput {
  matches: ComponentMatch[]
  totalComponents: number
  totalFiles: number
}

/**
 * Find React components in the codebase
 *
 * @example
 * ```typescript
 * // Find all components
 * const allComponents = await findComponents({
 *   pattern: 'src/**\/*.tsx'
 * })
 *
 * // Find specific component
 * const buttonComponents = await findComponents({
 *   pattern: 'src/**\/*.tsx',
 *   name: 'Button'
 * })
 *
 * // Find only exported function components
 * const exported = await findComponents({
 *   pattern: 'src/**\/*.tsx',
 *   type: 'function',
 *   exportedOnly: true
 * })
 *
 * for (const match of buttonComponents.matches) {
 *   console.log(`${match.file}:${match.component.line} - ${match.component.name}`)
 * }
 * ```
 */
export async function findComponents(
  input: FindComponentsInput = {}
): Promise<FindComponentsOutput> {
  const { pattern = 'src/**/*.{tsx,jsx}', exclude, name, type, exportedOnly = false } = input

  // Find all files matching pattern
  const files = findFiles(pattern, { ignore: exclude })

  const matches: ComponentMatch[] = []
  const filesWithComponents = new Set<string>()

  for (const file of files) {
    const fullPath = getProjectPath(file)
    const components = extractComponents(fullPath)

    for (const component of components) {
      // Apply filters
      if (name && component.name !== name) continue
      if (type && component.type !== type) continue
      if (exportedOnly && !component.isExported) continue

      matches.push({
        file,
        component
      })

      filesWithComponents.add(file)
    }
  }

  // Sort by file, then by line
  matches.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }
    return a.component.line - b.component.line
  })

  return {
    matches,
    totalComponents: matches.length,
    totalFiles: filesWithComponents.size
  }
}

export type { FindComponentsInput as Input, FindComponentsOutput as Output }
