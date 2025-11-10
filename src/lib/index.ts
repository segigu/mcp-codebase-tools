// Config management
export {
  loadConfig,
  saveConfig,
  DEFAULT_CONFIG,
  type McpConfig
} from './config.js';

// Project detection
export {
  findProjectRoot,
  detectFramework,
  getSourceDirectory,
  getFileExtensions,
  getGlobPatterns,
  getExcludePatterns
} from './project-detector.js';

// Re-export utilities
export * from '../utils/index.js';

// Re-export tools
export * from '../tools/index.js';
