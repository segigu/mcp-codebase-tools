# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-10

### Added
- Initial release of @mcp/codebase-tools
- 30 code analysis tools across 6 categories
- Global CLI with commander framework
- Interactive `mcp init` command for project setup
- Configuration system with mcp.config.js support
- Project root and framework auto-detection
- Comprehensive caching system (90-98% token savings)
- Audit logging and history tracking
- Beautiful terminal output with chalk and ora
- Update notifier for new versions

### Tools Included
- **Audit Tools (11):** security-audit, a11y-audit, tech-debt, test-coverage-gaps, and more
- **Search Tools (5):** find-imports, find-usages, find-components, and more
- **Navigate Tools (3):** callers-analysis, code-structure
- **Composite Skills (3):** full-project-audit, code-health-check, project-docs
- **Refactor Tools (2):** rename-symbol, update-imports
- **Utility Tools (6):** cache management, audit history, and more

### Features
- Framework agnostic (React, Vue, Angular, Svelte)
- Supports TypeScript and JavaScript
- Configurable glob patterns and exclusions
- JSON and formatted output modes
- Verbose logging option
- Cache management (status, clear)
- Audit history and trends

### Documentation
- Comprehensive README with examples
- Quick start guide
- Command cheat sheet
- FAQ and troubleshooting
- Glossary of terms
- Claude Code integration guide

[1.0.0]: https://github.com/mcp-tools/codebase-tools/releases/tag/v1.0.0
