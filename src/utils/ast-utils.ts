import * as parser from '@babel/parser'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
// @ts-ignore - Import CommonJS module
const traverse = require('@babel/traverse').default
import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { readFileSafe } from './fs-utils.js'

/**
 * Parse options for Babel parser
 */
const PARSE_OPTIONS: parser.ParserOptions = {
  sourceType: 'module',
  plugins: [
    'typescript',
    'jsx',
    'decorators-legacy',
    'classProperties',
    'dynamicImport',
    'optionalChaining',
    'nullishCoalescingOperator'
  ]
}

/**
 * Function/method information
 */
export interface FunctionInfo {
  name: string
  type: 'function' | 'arrow' | 'method' | 'class-method'
  params: string[]
  isAsync: boolean
  isExported: boolean
  line: number
  complexity: number
}

/**
 * Import information
 */
export interface ImportInfo {
  source: string
  specifiers: Array<{
    imported: string
    local: string
    type: 'default' | 'named' | 'namespace'
  }>
  line: number
}

/**
 * Export information
 */
export interface ExportInfo {
  name: string
  type: 'default' | 'named'
  line: number
}

/**
 * Component information (React/JSX)
 */
export interface ComponentInfo {
  name: string
  type: 'function' | 'class' | 'arrow'
  props: string[]
  hasState: boolean
  hasEffects: boolean
  isExported: boolean
  line: number
}

/**
 * Type information (TypeScript)
 */
export interface TypeInfo {
  name: string
  type: 'interface' | 'type' | 'enum' | 'class'
  isExported: boolean
  line: number
}

/**
 * Parse file to AST
 */
export function parseFile(filePath: string): t.File | null {
  try {
    const content = readFileSafe(filePath)
    if (!content) return null

    return parser.parse(content, PARSE_OPTIONS)
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error)
    return null
  }
}

/**
 * Parse code string to AST
 */
export function parseCode(code: string): t.File | null {
  try {
    return parser.parse(code, PARSE_OPTIONS)
  } catch (error) {
    console.error('Error parsing code:', error)
    return null
  }
}

/**
 * Extract all functions from file
 */
export function extractFunctions(filePath: string): FunctionInfo[] {
  const ast = parseFile(filePath)
  if (!ast) return []

  const functions: FunctionInfo[] = []

  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node
      functions.push({
        name: node.id?.name || 'anonymous',
        type: 'function',
        params: node.params.map(p => (t.isIdentifier(p) ? p.name : 'unknown')),
        isAsync: node.async,
        isExported: path.parent.type === 'ExportNamedDeclaration' || path.parent.type === 'ExportDefaultDeclaration',
        line: node.loc?.start.line || 0,
        complexity: calculateComplexity(path)
      })
    },

    ArrowFunctionExpression(path) {
      const parent = path.parent
      let name = 'anonymous'

      if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
        name = parent.id.name
      }

      functions.push({
        name,
        type: 'arrow',
        params: path.node.params.map(p => (t.isIdentifier(p) ? p.name : 'unknown')),
        isAsync: path.node.async,
        isExported: false, // Handled by variable declaration export
        line: path.node.loc?.start.line || 0,
        complexity: calculateComplexity(path)
      })
    },

    ClassMethod(path) {
      const node = path.node
      functions.push({
        name: t.isIdentifier(node.key) ? node.key.name : 'unknown',
        type: 'class-method',
        params: node.params.map(p => (t.isIdentifier(p) ? p.name : 'unknown')),
        isAsync: node.async,
        isExported: false, // Handled by class export
        line: node.loc?.start.line || 0,
        complexity: calculateComplexity(path)
      })
    }
  })

  return functions
}

/**
 * Extract all imports from file
 */
export function extractImports(filePath: string): ImportInfo[] {
  const ast = parseFile(filePath)
  if (!ast) return []

  const imports: ImportInfo[] = []

  traverse(ast, {
    ImportDeclaration(path) {
      const node = path.node
      const specifiers = node.specifiers.map(spec => {
        if (t.isImportDefaultSpecifier(spec)) {
          return {
            imported: 'default',
            local: spec.local.name,
            type: 'default' as const
          }
        } else if (t.isImportNamespaceSpecifier(spec)) {
          return {
            imported: '*',
            local: spec.local.name,
            type: 'namespace' as const
          }
        } else if (t.isImportSpecifier(spec)) {
          return {
            imported: t.isIdentifier(spec.imported) ? spec.imported.name : 'unknown',
            local: spec.local.name,
            type: 'named' as const
          }
        }
        return {
          imported: 'unknown',
          local: 'unknown',
          type: 'named' as const
        }
      })

      imports.push({
        source: node.source.value,
        specifiers,
        line: node.loc?.start.line || 0
      })
    }
  })

  return imports
}

/**
 * Extract all exports from file
 */
export function extractExports(filePath: string): ExportInfo[] {
  const ast = parseFile(filePath)
  if (!ast) return []

  const exports: ExportInfo[] = []

  traverse(ast, {
    ExportNamedDeclaration(path) {
      const node = path.node

      if (node.declaration) {
        if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
          exports.push({
            name: node.declaration.id.name,
            type: 'named',
            line: node.loc?.start.line || 0
          })
        } else if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach(decl => {
            if (t.isIdentifier(decl.id)) {
              exports.push({
                name: decl.id.name,
                type: 'named',
                line: node.loc?.start.line || 0
              })
            }
          })
        }
      }

      node.specifiers?.forEach(spec => {
        if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
          exports.push({
            name: spec.exported.name,
            type: 'named',
            line: node.loc?.start.line || 0
          })
        }
      })
    },

    ExportDefaultDeclaration(path) {
      const node = path.node
      let name = 'default'

      if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
        name = node.declaration.id.name
      } else if (t.isIdentifier(node.declaration)) {
        name = node.declaration.name
      }

      exports.push({
        name,
        type: 'default',
        line: node.loc?.start.line || 0
      })
    }
  })

  return exports
}

/**
 * Extract React components from file
 */
export function extractComponents(filePath: string): ComponentInfo[] {
  const ast = parseFile(filePath)
  if (!ast) return []

  const components: ComponentInfo[] = []

  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node
      if (!node.id) return

      // Check if function returns JSX
      let hasJSX = false
      path.traverse({
        JSXElement() {
          hasJSX = true
        },
        JSXFragment() {
          hasJSX = true
        }
      })

      if (hasJSX) {
        components.push({
          name: node.id.name,
          type: 'function',
          props: node.params.map(p => (t.isIdentifier(p) ? p.name : 'unknown')),
          hasState: hasStateUsage(path),
          hasEffects: hasEffectUsage(path),
          isExported: path.parent.type === 'ExportNamedDeclaration' || path.parent.type === 'ExportDefaultDeclaration',
          line: node.loc?.start.line || 0
        })
      }
    },

    VariableDeclarator(path) {
      const node = path.node
      if (!t.isIdentifier(node.id)) return
      if (!t.isArrowFunctionExpression(node.init) && !t.isFunctionExpression(node.init)) return

      // Check if returns JSX
      let hasJSX = false
      path.traverse({
        JSXElement() {
          hasJSX = true
        },
        JSXFragment() {
          hasJSX = true
        }
      })

      if (hasJSX) {
        components.push({
          name: node.id.name,
          type: 'arrow',
          props: node.init.params.map(p => (t.isIdentifier(p) ? p.name : 'unknown')),
          hasState: hasStateUsage(path),
          hasEffects: hasEffectUsage(path),
          isExported: false,
          line: node.loc?.start.line || 0
        })
      }
    }
  })

  return components
}

/**
 * Extract TypeScript types from file
 */
export function extractTypes(filePath: string): TypeInfo[] {
  const ast = parseFile(filePath)
  if (!ast) return []

  const types: TypeInfo[] = []

  traverse(ast, {
    TSInterfaceDeclaration(path) {
      const node = path.node
      types.push({
        name: node.id.name,
        type: 'interface',
        isExported: path.parent.type === 'ExportNamedDeclaration',
        line: node.loc?.start.line || 0
      })
    },

    TSTypeAliasDeclaration(path) {
      const node = path.node
      types.push({
        name: node.id.name,
        type: 'type',
        isExported: path.parent.type === 'ExportNamedDeclaration',
        line: node.loc?.start.line || 0
      })
    },

    TSEnumDeclaration(path) {
      const node = path.node
      types.push({
        name: node.id.name,
        type: 'enum',
        isExported: path.parent.type === 'ExportNamedDeclaration',
        line: node.loc?.start.line || 0
      })
    }
  })

  return types
}

/**
 * Calculate cyclomatic complexity
 */
function calculateComplexity(path: NodePath): number {
  let complexity = 1

  path.traverse({
    IfStatement() {
      complexity++
    },
    ConditionalExpression() {
      complexity++
    },
    ForStatement() {
      complexity++
    },
    ForInStatement() {
      complexity++
    },
    ForOfStatement() {
      complexity++
    },
    WhileStatement() {
      complexity++
    },
    DoWhileStatement() {
      complexity++
    },
    SwitchCase(casePath) {
      if (casePath.node.test) complexity++ // Don't count default case
    },
    CatchClause() {
      complexity++
    },
    LogicalExpression(logicalPath) {
      if (logicalPath.node.operator === '&&' || logicalPath.node.operator === '||') {
        complexity++
      }
    }
  })

  return complexity
}

/**
 * Check if path uses React state hooks
 */
function hasStateUsage(path: NodePath): boolean {
  let hasState = false

  path.traverse({
    CallExpression(callPath) {
      const callee = callPath.node.callee
      if (t.isIdentifier(callee) && (callee.name === 'useState' || callee.name === 'useReducer')) {
        hasState = true
      }
    }
  })

  return hasState
}

/**
 * Check if path uses React effect hooks
 */
function hasEffectUsage(path: NodePath): boolean {
  let hasEffect = false

  path.traverse({
    CallExpression(callPath) {
      const callee = callPath.node.callee
      if (
        t.isIdentifier(callee) &&
        (callee.name === 'useEffect' || callee.name === 'useLayoutEffect')
      ) {
        hasEffect = true
      }
    }
  })

  return hasEffect
}
