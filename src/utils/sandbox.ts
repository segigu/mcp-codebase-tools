import { VM } from 'vm2'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'fast-glob'

/**
 * Sandbox configuration options
 */
export interface SandboxOptions {
  /** Execution timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Project root directory (default: process.cwd()) */
  projectRoot?: string
  /** Patterns to exclude from file operations */
  excludePatterns?: string[]
}

/**
 * Code execution sandbox using vm2
 * Provides safe, isolated environment for code execution with file system access
 */
export class CodeSandbox {
  private options: Required<SandboxOptions>

  constructor(options: SandboxOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 30000,
      projectRoot: options.projectRoot ?? process.cwd(),
      excludePatterns: options.excludePatterns ?? ['node_modules', 'dist', 'build', '.git']
    }
  }

  /**
   * Create sandbox context with utilities
   */
  private createSandbox() {
    return {
      // File system utilities
      fs: {
        readFileSync: fs.readFileSync,
        existsSync: fs.existsSync,
        statSync: fs.statSync,
        readdirSync: fs.readdirSync
      },
      // Path utilities
      path: {
        join: path.join,
        resolve: path.resolve,
        dirname: path.dirname,
        basename: path.basename,
        extname: path.extname,
        relative: path.relative
      },
      // Glob utilities
      glob: glob.sync,
      // Project configuration
      projectRoot: this.options.projectRoot,
      excludePatterns: this.options.excludePatterns,
      // Console for debugging
      console: {
        log: console.log,
        error: console.error,
        warn: console.warn
      }
    }
  }

  /**
   * Execute code in sandbox
   */
  execute<T = any>(code: string): T {
    try {
      const vm = new VM({
        timeout: this.options.timeout,
        sandbox: this.createSandbox()
      })

      return vm.run(code)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Sandbox execution error: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Execute async code in sandbox
   */
  async executeAsync<T = any>(code: string): Promise<T> {
    try {
      const vm = new VM({
        timeout: this.options.timeout,
        sandbox: this.createSandbox()
      })

      // Wrap code in async IIFE
      const wrappedCode = `
        (async () => {
          ${code}
        })()
      `

      return await vm.run(wrappedCode)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Sandbox async execution error: ${error.message}`)
      }
      throw error
    }
  }
}

/**
 * Helper function for executing code in sandbox
 */
export function executeSandboxed<T = any>(code: string, options?: SandboxOptions): T {
  const sandbox = new CodeSandbox(options)
  return sandbox.execute<T>(code)
}

/**
 * Helper function for executing async code in sandbox
 */
export async function executeSandboxedAsync<T = any>(
  code: string,
  options?: SandboxOptions
): Promise<T> {
  const sandbox = new CodeSandbox(options)
  return sandbox.executeAsync<T>(code)
}
