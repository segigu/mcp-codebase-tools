# CLAUDE.md - MCP Codebase Tools Development

This file provides guidance to Claude Code when working on MCP Codebase Tools.

---

## 🎯 Project Overview

**MCP Codebase Tools** - Global CLI tool providing 30 code analysis commands with 90-98% token savings for AI-powered analysis.

**Current Version:** v1.1.1
**Status:** 30/30 tools working (100%) ✅
**GitHub:** https://github.com/segigu/mcp-codebase-tools

---

## 🚨 CRITICAL: Use MCP Commands (ALWAYS!)

**YOU MUST use MCP commands instead of Read/Grep/Glob whenever analyzing this codebase!**

### ✅ DO THIS (Use MCP):

```bash
# Instead of reading multiple files:
npm run analyze:structure
# or
mcp mcp:structure

# Instead of grepping for complexity:
npm run analyze:complexity

# Instead of multiple Read commands for tech debt:
npm run analyze:tech-debt

# Before making changes, check code health:
npm run analyze:health
```

### ❌ DON'T DO THIS:

```bash
# ❌ WRONG - wastes tokens!
Read src/tools/analyze/*.ts
Grep "export" src/
Read src/lib/config.ts
Read src/cli/index.ts
```

### 📋 Available MCP Commands for Self-Analysis:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run analyze:structure` | Project structure | Understanding architecture, finding files |
| `npm run analyze:complexity` | Code complexity | Finding complex functions to refactor |
| `npm run analyze:security` | Security issues | Before committing security-related code |
| `npm run analyze:unused` | Unused exports | Cleanup, finding dead code |
| `npm run analyze:tech-debt` | TODOs, FIXMEs | Planning work, finding what needs fixing |
| `npm run analyze:health` | Overall code health | Comprehensive check before major changes |
| `npm run analyze:audit` | Full audit | Before releases, comprehensive review |
| `npm run analyze:git` | Git hotspots | Finding frequently changed files |
| `npm run analyze:all` | Run all above | Complete analysis |

### 🎯 When to Use MCP vs Manual Tools:

**Use MCP when:**
- ✅ Understanding project structure
- ✅ Looking for patterns across multiple files
- ✅ Analyzing code quality/complexity
- ✅ Searching for specific types of code (components, APIs, etc.)
- ✅ Finding technical debt or issues
- ✅ Getting comprehensive overview

**Use Read/Grep when:**
- ✅ Reading specific file you already know path to
- ✅ Making targeted edits to known files
- ✅ Searching for very specific string in 1-2 files

**IMPORTANT:** If you need to understand the codebase structure or find patterns, ALWAYS try MCP first! It's 90-98% more efficient!

---

## 📋 Critical Context Files

**MUST READ before starting work:**

1. **DEVELOPMENT_ROADMAP.md** - Complete development plan, issues, and priorities
2. **README.md** - Project overview and usage
3. **PUBLISHING_GUIDE.md** - How to publish and update
4. **package.json** - Dependencies and scripts
5. **tsconfig.json** - TypeScript configuration

---

## 🚨 Critical Rules

### Rule #1: Always Build and Test

**Before committing ANY changes:**

```bash
# 1. Build
npm run build

# 2. Test globally
npm link
mcp list
mcp mcp:structure --path ~/Metacell

# 3. Check for errors
# Build should complete (TypeScript errors are OK for now)
# CLI commands should work

# 4. Only then commit
git add .
git commit -m "fix: description"
```

### Rule #2: ES Modules - Always Use .js Extensions

**TypeScript imports MUST include .js:**

```typescript
// ✅ CORRECT
import { something } from './utils/helper.js'
import { other } from '../lib/config.js'

// ❌ WRONG - Will fail at runtime!
import { something } from './utils/helper'
import { other } from '../lib/config'
```

**Why:** TypeScript doesn't add .js automatically in ES modules mode.

### Rule #3: Fix TypeScript Errors Gradually

**Current state:** `strict: false` to allow build

**Process:**
1. Fix composite tools first (priority 1)
2. Fix cache/audit commands (priority 2)
3. Then enable stricter TypeScript

**Do NOT** make tsconfig stricter until all tools work!

---

## 📁 Project Structure

```
mcp-codebase-tools/
├── src/
│   ├── cli/              # CLI framework
│   │   ├── index.ts      # Main CLI entry (Commander.js)
│   │   ├── executor.ts   # Tool execution logic
│   │   ├── formatter.ts  # Output formatting
│   │   └── commands/     # CLI commands (init, list, cache, audit)
│   │
│   ├── lib/              # Core library
│   │   ├── config.ts     # Configuration system (cosmiconfig)
│   │   └── project-detector.ts  # Framework detection
│   │
│   ├── tools/            # Analysis tools (27 working)
│   │   ├── analyze/      # 20 analysis tools
│   │   ├── search/       # 5 search tools
│   │   ├── refactor/     # 2 refactoring tools
│   │   └── composite/    # 3 composite tools (DISABLED - needs fix!)
│   │
│   └── utils/            # Utilities
│       ├── ast-utils.ts       # AST parsing (@babel/parser)
│       ├── fs-utils.ts        # File system helpers
│       ├── cache-manager.ts   # Caching (needs refactor to class!)
│       ├── audit-logger.ts    # Audit logging (needs refactor to class!)
│       ├── tool-registry.ts   # Tool metadata registry
│       └── types.ts           # Shared types
│
├── dist/                 # Compiled JavaScript (git-ignored)
├── docs/                 # Documentation (10 files)
├── bin/mcp.js           # Executable entry point
├── package.json         # Package config
└── tsconfig.json        # TypeScript config
```

---

## 🔧 Development Workflow

### Setup (First Time)

```bash
# 1. Clone
git clone https://github.com/segigu/mcp-codebase-tools.git
cd mcp-codebase-tools

# 2. Install
npm install

# 3. Build
npm run build

# 4. Link globally
npm link

# 5. Test
mcp list
```

### Daily Development

```bash
# 1. Create branch
git checkout -b fix/composite-tools

# 2. Make changes
# ... edit files ...

# 3. Build and test
npm run build
mcp list
mcp mcp:structure --path ~/Metacell

# 4. Commit
git add .
git commit -m "fix(composite): resolve type issues"

# 5. Push
git push origin fix/composite-tools
```

### Testing Changes

```bash
# Test in another project
cd ~/Metacell
npm link @mcp/codebase-tools
npm run mcp:structure

# If something breaks, rebuild
cd ~/mcp-codebase-tools
npm run build
```

---

## 🎯 Current Priorities (v1.1)

### Priority 1: Fix Composite Tools (HIGH)

**Files to fix:**
- `src/tools/composite/codeHealthCheck.ts.bak`
- `src/tools/composite/documentationGenerator.ts.bak`
- `src/tools/composite/fullProjectAudit.ts.bak`

**Problem:** Type mismatches between tool inputs/outputs

**Solution steps:**
1. Read DEVELOPMENT_ROADMAP.md "Issue #1" section
2. Check actual tool outputs in `src/tools/analyze/*.ts`
3. Fix type imports one by one
4. Test each tool after fixing
5. Remove `.bak` extension when working
6. Re-enable in `src/tools/composite/index.ts`

**Start with:** `codeHealthCheck.ts` (simplest)

### Priority 2: Fix Cache & Audit Commands (HIGH)

**Files to fix:**
- `src/utils/cache-manager.ts` - Convert functions to class
- `src/utils/audit-logger.ts` - Convert functions to class
- `src/cli/commands/cache.ts` - Currently disabled
- `src/cli/commands/audit.ts` - Currently disabled

**Problem:** CLI expects classes, utils export functions

**Solution:**
1. Read DEVELOPMENT_ROADMAP.md "Issue #2" section
2. Refactor utils to export classes
3. Re-enable CLI commands in `src/cli/index.ts`
4. Test: `mcp cache status`, `mcp audit summary`

### Priority 3: Clean Up TypeScript Errors (MEDIUM)

**Files with errors:**
- `src/tools/analyze/gitHotspots.ts:104` - Type mismatch
- `src/cli/commands/audit.ts` - Property access on 'unknown'
- `src/cli/commands/cache.ts` - Property access on 'unknown'

**Solution:** Add proper type annotations and guards

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module" error

**Cause:** Missing `.js` extension in imports

**Fix:**
```typescript
// Change this:
import { helper } from './utils/helper'

// To this:
import { helper } from './utils/helper.js'
```

### Issue: TypeScript build fails

**Cause:** Strict type errors

**Temporary fix:**
```typescript
// Add @ts-ignore above problematic line
// @ts-ignore - TODO: Fix type mismatch
const result = someFunction();
```

**Proper fix:** Fix the actual type issue

### Issue: "mcp command not found" after changes

**Cause:** Need to rebuild

**Fix:**
```bash
cd ~/mcp-codebase-tools
npm run build
# mcp should work again
```

### Issue: Changes not reflected in Metacell

**Cause:** Not using npm link OR need rebuild

**Fix:**
```bash
# If using npm link:
cd ~/mcp-codebase-tools
npm run build
# Changes immediately available

# If NOT using npm link:
cd ~/Metacell
npm install --save-dev git+https://github.com/segigu/mcp-codebase-tools.git
```

---

## 📝 Commit Message Convention

Follow Conventional Commits:

```bash
# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
refactor: Code refactoring (no feature change)
test:     Add/update tests
chore:    Maintenance (deps, build, etc.)

# Examples:
git commit -m "feat(tools): add vue component analyzer"
git commit -m "fix(composite): resolve type mismatches in codeHealthCheck"
git commit -m "docs: update ROADMAP with v1.1 plans"
git commit -m "refactor(cache): convert to class-based architecture"
git commit -m "test: add unit tests for analyzeComplexity"
git commit -m "chore: update dependencies"
```

---

## 🧪 Testing Strategy

### Manual Testing (Required before commit)

```bash
# 1. Build
npm run build

# 2. Test CLI
mcp list
mcp mcp:structure --path ~/Metacell
mcp mcp:find-components --path ~/Metacell

# 3. Test specific tool (if you changed it)
mcp mcp:complexity --path ~/Metacell --verbose

# 4. Check for runtime errors
# Should not crash, should produce output
```

### Automated Testing (TODO - v1.1+)

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 📊 Success Criteria

### For v1.1 Release

- ✅ All 30 tools working (currently 27/30)
- ✅ No runtime errors in common use cases
- ✅ TypeScript builds without critical errors
- ✅ CLI commands work: `list`, `init`, `cache`, `audit`
- ✅ Documentation updated
- ✅ CHANGELOG.md updated

### For v1.2 Release

- ✅ Unit tests for all tools (80% coverage)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ All TypeScript errors fixed (`strict: true`)
- ✅ Performance optimizations
- ✅ Enhanced error handling

---

## 🚫 What NOT to Do

### ❌ DON'T: Make tsconfig stricter yet
```typescript
// Don't change yet:
"strict": false  // Keep this until all tools work
```

### ❌ DON'T: Remove @ts-ignore without fixing
```typescript
// Don't just remove:
// @ts-ignore
const result = tool.execute();

// Instead, fix the type:
const result: ToolOutput = tool.execute();
```

### ❌ DON'T: Commit without building
```bash
# Wrong workflow:
git add .
git commit -m "fix"
git push
# 💥 Might break production!

# Right workflow:
npm run build  # ← Test first!
git add .
git commit -m "fix"
git push
```

### ❌ DON'T: Change imports without .js
```typescript
// This will break at runtime!
import { helper } from './utils/helper'
// Always add .js ↓
import { helper } from './utils/helper.js'
```

---

## 🎯 Quick Start Checklist

**When opening this project in VS Code:**

1. ✅ Read `DEVELOPMENT_ROADMAP.md`
2. ✅ Check current branch: `git branch`
3. ✅ Install deps: `npm install`
4. ✅ Build: `npm run build`
5. ✅ Link: `npm link`
6. ✅ Test: `mcp list`
7. ✅ Pick a task from DEVELOPMENT_ROADMAP.md
8. ✅ Create branch: `git checkout -b fix/task-name`
9. ✅ Start coding!

---

## 📚 Useful Commands

```bash
# Development
npm run build        # Build TypeScript → JavaScript
npm run dev          # Watch mode (auto-rebuild)
npm link             # Link globally for testing

# Testing
mcp list                              # List all tools
mcp mcp:structure --path ~/Metacell  # Test structure tool
mcp --help                            # Show help

# Git
git status                      # Check changes
git log --oneline -10          # Recent commits
git checkout -b fix/issue-1    # New branch

# Debugging
npx tsc --noEmit               # Check types only
node dist/cli/index.js list   # Run directly
```

---

## 🎉 Ready to Start!

**First task:** Read `DEVELOPMENT_ROADMAP.md` → Pick Priority 1 or 2 → Start coding!

**Questions?** Check the roadmap or ask the user.

**Stuck?** Look at existing working tools in `src/tools/analyze/` for examples.

---

**Good luck! 🚀**
