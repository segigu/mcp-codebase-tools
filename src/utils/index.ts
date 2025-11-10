/**
 * MCP Codebase Tools - Core Library
 *
 * This module provides core utilities for code analysis, sandbox execution,
 * and file system operations.
 */

// Sandbox execution
export {
  CodeSandbox,
  executeSandboxed,
  executeSandboxedAsync,
  type SandboxOptions
} from './sandbox.js'

// File system utilities
export {
  PROJECT_ROOT,
  DEFAULT_EXCLUDE_PATTERNS,
  getProjectPath,
  shouldExclude,
  readFileSafe,
  getFileInfo,
  findFiles,
  findDirectories,
  getAllFiles,
  countLines,
  countTotalLines,
  getExtensionStats,
  type FileInfo
} from './fs-utils.js'

// AST utilities
export {
  parseFile,
  parseCode,
  extractFunctions,
  extractImports,
  extractExports,
  extractComponents,
  extractTypes,
  type FunctionInfo,
  type ImportInfo,
  type ExportInfo,
  type ComponentInfo,
  type TypeInfo
} from './ast-utils.js'
