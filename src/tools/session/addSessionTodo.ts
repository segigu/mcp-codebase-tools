import { sessionManager } from '../../utils/session-manager.js'

/**
 * Input for session-todo command
 */
export interface AddTodoInput {
  /** TODO text */
  todo: string
  /** Category (uses last checkpoint category if not provided) */
  category?: string
  /** Project path */
  projectPath?: string
}

/**
 * Output from session-todo command
 */
export interface AddTodoOutput {
  /** TODO was added to this checkpoint */
  checkpointId: string
  /** Category */
  category: string
  /** All TODOs in this category */
  todos: string[]
}

/**
 * Add TODO to current session
 *
 * Adds a TODO item to the last checkpoint in the specified category.
 * If no category is provided, uses the last checkpoint's category.
 *
 * @example
 * ```typescript
 * const result = await addSessionTodo({
 *   todo: "Add error handling for token refresh",
 *   category: "auth"
 * })
 *
 * console.log(`TODO added to ${result.category}`)
 * console.log(`Total TODOs: ${result.todos.length}`)
 * ```
 */
export async function addSessionTodo(
  input: AddTodoInput
): Promise<AddTodoOutput> {
  const {
    todo,
    category,
    projectPath = process.cwd()
  } = input

  if (!todo || todo.trim().length === 0) {
    throw new Error('TODO text is required')
  }

  // Add TODO
  const result = await sessionManager.addTodo(
    projectPath,
    todo,
    category
  )

  return result
}

export type { AddTodoInput as Input, AddTodoOutput as Output }
