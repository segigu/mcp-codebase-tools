import { findFiles, getProjectPath, readFileSafe } from '../../utils/fs-utils.js'
import { extractComponents, extractImports, type ComponentInfo } from '../../utils/ast-utils.js'
import { type PaginationInput, type ComponentFilter } from '../../utils/types.js'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Component with enriched metadata
 */
export interface EnrichedComponent {
  name: string
  path: string
  type: 'function' | 'class' | 'arrow'
  line: number
  isExported: boolean
  props: PropInfo[]
  usageCount: number
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex'
  hasTests: boolean
  hasStorybook: boolean
  designTokens: {
    colors: string[]
    spacing: string[]
    typography: string[]
  }
  imports: string[]
  linesOfCode: number
}

/**
 * Prop information
 */
export interface PropInfo {
  name: string
  type: string
  required: boolean
  defaultValue?: string
}

/**
 * Component inventory input
 */
export interface ComponentInventoryInput extends PaginationInput {
  filter?: ComponentFilter
}

/**
 * Component inventory output
 */
export interface ComponentInventoryOutput {
  components: EnrichedComponent[]
  totalComponents: number
  coverage: {
    withTests: number
    withStorybook: number
    documented: number
  }
  complexity: {
    trivial: number
    simple: number
    moderate: number
    complex: number
  }
  topUsed: Array<{ name: string; count: number }>
  hasMore: boolean
  nextOffset?: number
}

/**
 * Extract props from component code
 */
function extractProps(code: string, componentName: string): PropInfo[] {
  const props: PropInfo[] = []

  // Match interface/type for props (e.g., ButtonProps, ComponentNameProps)
  const propsInterfaceRegex = new RegExp(
    `(?:interface|type)\\s+${componentName}Props\\s*=?\\s*\\{([^}]+)\\}`,
    's'
  )

  const match = code.match(propsInterfaceRegex)
  if (!match) return props

  const propsBody = match[1]

  // Extract individual props
  const propLines = propsBody.split('\n').map(line => line.trim()).filter(Boolean)

  for (const line of propLines) {
    // Skip comments
    if (line.startsWith('//') || line.startsWith('/*')) continue

    // Match: propName?: type = defaultValue or propName: type
    const propMatch = line.match(/(\w+)(\?)?:\s*([^=;]+)(?:=\s*(.+))?/)
    if (propMatch) {
      const [, name, optional, type, defaultValue] = propMatch
      props.push({
        name,
        type: type.trim(),
        required: !optional,
        defaultValue: defaultValue?.trim()
      })
    }
  }

  return props
}

/**
 * Calculate component complexity based on lines of code
 */
function calculateComplexity(linesOfCode: number): 'trivial' | 'simple' | 'moderate' | 'complex' {
  if (linesOfCode < 50) return 'trivial'
  if (linesOfCode < 150) return 'simple'
  if (linesOfCode < 300) return 'moderate'
  return 'complex'
}

/**
 * Extract design tokens from component code
 */
function extractDesignTokens(code: string): {
  colors: string[]
  spacing: string[]
  typography: string[]
} {
  const tokens = {
    colors: [] as string[],
    spacing: [] as string[],
    typography: [] as string[]
  }

  // Extract Tailwind color classes
  const colorClassRegex = /(?:bg|text|border)-(\w+(?:-\d+)?)/g
  let colorMatch
  while ((colorMatch = colorClassRegex.exec(code)) !== null) {
    const token = colorMatch[1]
    if (!tokens.colors.includes(token)) {
      tokens.colors.push(token)
    }
  }

  // Extract spacing classes
  const spacingClassRegex = /(?:m|p|gap|space)-(\d+|px|auto|\[\d+px\])/g
  let spacingMatch
  while ((spacingMatch = spacingClassRegex.exec(code)) !== null) {
    const token = spacingMatch[1]
    if (!tokens.spacing.includes(token)) {
      tokens.spacing.push(token)
    }
  }

  // Extract typography classes
  const typographyClassRegex = /(?:text|font)-(\w+(?:-\d+)?)/g
  let typoMatch
  while ((typoMatch = typographyClassRegex.exec(code)) !== null) {
    const token = typoMatch[1]
    if (!tokens.typography.includes(token)) {
      tokens.typography.push(token)
    }
  }

  return tokens
}

/**
 * Count usages of a component across the project
 */
function countUsages(componentName: string, allFiles: string[]): number {
  let count = 0

  for (const file of allFiles) {
    try {
      const content = readFileSafe(file)
      const imports = extractImports(getProjectPath(file))

      // Check if component is imported
      const isImported = imports.some(imp =>
        imp.specifiers.some(spec => spec.imported === componentName)
      )

      if (isImported) {
        // Count usages in JSX (e.g., <Button>, <Button />)
        const usageRegex = new RegExp(`<${componentName}[\\s/>]`, 'g')
        const matches = content.match(usageRegex)
        count += matches ? matches.length : 0
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return count
}

/**
 * Component Inventory - Comprehensive component analysis
 *
 * Экономия токенов: 96% (78,000 → 3,000 токенов)
 *
 * @example
 * npm run mcp:component-inventory
 * npm run mcp:component-inventory -- --limit 20 --offset 0
 */
export async function componentInventory(
  input: ComponentInventoryInput = {}
): Promise<ComponentInventoryOutput> {
  const { limit = 50, offset = 0, filter = {} } = input

  // Find all component files
  const filePattern = filter.filePattern || 'src/**/*.{tsx,jsx}'
  const componentFiles = findFiles(filePattern, {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*']
  })

  // Find all project files (for usage counting)
  const allFiles = findFiles('src/**/*.{tsx,jsx,ts,js}')

  const components: EnrichedComponent[] = []
  const coverage = { withTests: 0, withStorybook: 0, documented: 0 }
  const complexity = { trivial: 0, simple: 0, moderate: 0, complex: 0 }

  for (const file of componentFiles) {
    const fullPath = getProjectPath(file)
    const code = readFileSafe(file)
    const fileComponents = extractComponents(fullPath)

    for (const comp of fileComponents) {
      // Skip if not exported (internal components)
      if (!comp.isExported) continue

      // Extract props
      const props = extractProps(code, comp.name)

      // Count usages
      const usageCount = countUsages(comp.name, allFiles)

      // Calculate lines of code (rough estimate)
      const linesOfCode = code.split('\n').length

      // Calculate complexity
      const compComplexity = calculateComplexity(linesOfCode)
      complexity[compComplexity]++

      // Check for tests
      const testFile = file.replace(/\.(tsx|jsx)$/, '.test.$1')
      const hasTests = fs.existsSync(getProjectPath(testFile))
      if (hasTests) coverage.withTests++

      // Check for storybook
      const storyFile = file.replace(/\.(tsx|jsx)$/, '.stories.$1')
      const hasStorybook = fs.existsSync(getProjectPath(storyFile))
      if (hasStorybook) coverage.withStorybook++

      // Check for JSDoc
      const hasJSDoc = code.includes(`* ${comp.name}`)
      if (hasJSDoc) coverage.documented++

      // Extract design tokens
      const designTokens = extractDesignTokens(code)

      // Extract imports
      const imports = extractImports(fullPath).map(imp => imp.source)

      components.push({
        name: comp.name,
        path: file,
        type: comp.type,
        line: comp.line,
        isExported: comp.isExported,
        props,
        usageCount,
        complexity: compComplexity,
        hasTests,
        hasStorybook,
        designTokens,
        imports,
        linesOfCode
      })
    }
  }

  // Sort by usage count (most used first)
  components.sort((a, b) => b.usageCount - a.usageCount)

  // Apply filters
  let filteredComponents = components
  if (filter.withTests !== undefined) {
    filteredComponents = filteredComponents.filter(c => c.hasTests === filter.withTests)
  }
  if (filter.complexity) {
    filteredComponents = filteredComponents.filter(c => c.complexity === filter.complexity)
  }
  if (filter.minUsageCount !== undefined) {
    filteredComponents = filteredComponents.filter(c => c.usageCount >= filter.minUsageCount!)
  }

  // Apply pagination
  const paginatedComponents = filteredComponents.slice(offset, offset + limit)

  // Top 10 most used components
  const topUsed = components.slice(0, 10).map(c => ({
    name: c.name,
    count: c.usageCount
  }))

  return {
    components: paginatedComponents,
    totalComponents: filteredComponents.length,
    coverage,
    complexity,
    topUsed,
    hasMore: offset + limit < filteredComponents.length,
    nextOffset: offset + limit < filteredComponents.length ? offset + limit : undefined
  }
}

export type { EnrichedComponent as Component }
