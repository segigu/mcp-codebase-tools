# MCP Codebase Tools - Project Context

## Overview

Global CLI tool for AI-powered code analysis with 90-98% token savings.

**Version:** 1.0.0
**Status:** 27/30 tools working (90%)
**GitHub:** https://github.com/segigu/mcp-codebase-tools

## Tech Stack

- **TypeScript 5.9.3** - ES2022 + ESNext
- **Node.js 18+** - ES Modules
- **Commander.js** - CLI framework
- **@babel/parser** - AST analysis
- **Cosmiconfig** - Configuration system

## Project Structure

```
src/
├── cli/          # CLI (index, commands, executor, formatter)
├── lib/          # Config & detection
├── tools/        # 27 analysis tools
│   ├── analyze/  # 20 tools ✅
│   ├── search/   # 5 tools ✅
│   ├── refactor/ # 2 tools ✅
│   └── composite/# 3 tools ❌ (needs fix)
└── utils/        # AST, fs, cache, audit, registry
```

## Critical Rules

1. **Always use .js extensions** in imports (ES modules)
2. **Build before commit**: `npm run build`
3. **Test with**: `npm link` → `mcp list`
4. **Read DEVELOPMENT_ROADMAP.md** before starting

## Current Priorities

**v1.1 Roadmap:**
1. Fix 3 composite tools (type mismatches)
2. Fix cache/audit commands (convert to classes)
3. Clean up TypeScript errors

**See:** DEVELOPMENT_ROADMAP.md for details

## Quick Commands

```bash
npm run build    # Build
npm link         # Link globally
mcp list         # Test
mcp --help       # Help
```

## Important Files

- **CLAUDE.md** - Complete dev guide
- **DEVELOPMENT_ROADMAP.md** - Roadmap & issues
- **PUBLISHING_GUIDE.md** - How to publish
- **package.json** - Package config
- **tsconfig.json** - TypeScript config (strict: false)
