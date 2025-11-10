/**
 * MCP Codebase Tools - Refactoring Tools
 *
 * Tools for automated refactoring operations like renaming symbols
 * and updating import paths.
 */

export {
  renameSymbol,
  type RenameSymbolInput,
  type RenameSymbolOutput,
  type RenamedFile
} from './renameSymbol.js'

export {
  updateImports,
  type UpdateImportsInput,
  type UpdateImportsOutput,
  type UpdatedImport
} from './updateImports.js'
