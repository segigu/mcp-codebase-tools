# 🗺️ MCP Codebase Tools - Development Roadmap

## 📍 Current Status (v1.0.0)

### ✅ What Works (27/30 tools - 90%)

**Analysis Tools (11):**
- ✅ `mcp:security-audit` - Security vulnerabilities
- ✅ `mcp:a11y-audit` - Accessibility issues
- ✅ `mcp:tech-debt` - Technical debt calculation
- ✅ `mcp:test-coverage-gaps` - Untested code
- ✅ `mcp:i18n` - Localization analysis
- ✅ `mcp:unused` - Unused exports
- ✅ `mcp:complexity` - Code complexity
- ✅ `mcp:git-hotspots` - Most changed files
- ✅ `mcp:bundle-analysis` - Bundle size
- ✅ `mcp:state-management` - React state patterns
- ✅ `mcp:rerenders-detection` - React re-renders

**Search Tools (8):**
- ✅ `mcp:find-components` - List all components
- ✅ `mcp:structure` - Project structure
- ✅ `mcp:component-inventory` - Component inventory
- ✅ `mcp:design-tokens` - Extract design tokens
- ✅ `mcp:api-inventory` - API endpoints
- ✅ `mcp:tailwind-optimizer` - Tailwind optimization
- ✅ `mcp:mock-generator` - Generate mocks
- ✅ `mcp:docs-generator` - Generate docs

**Navigation Tools (3):**
- ✅ `mcp:callers` - Find function callers
- ✅ `mcp:find-imports` - Find imports
- ✅ `mcp:find-usages` - Find usages

**Refactoring Tools (2):**
- ✅ `mcp:rename-symbol` - Rename across files
- ✅ `mcp:update-imports` - Update imports

**Utility Tools (3):**
- ✅ `mcp:audit-history` - Audit history (placeholder)
- ✅ `mcp:audit-summary` - Audit summary (placeholder)
- ✅ `mcp:help` - Help command

### ⏳ What Needs Fixing (3/30 tools - 10%)

**Composite Tools (temporarily disabled):**
1. ❌ `fullProjectAudit` - Comprehensive project audit
2. ❌ `codeHealthCheck` - Code health metrics
3. ❌ `documentationGenerator` - Auto-generate documentation

**CLI Commands (temporarily disabled):**
4. ❌ `mcp cache` - Cache management
5. ❌ `mcp audit` - Audit management

---

## 🎯 v1.1 Roadmap - Priority Fixes

### Issue #1: Fix Composite Tools TypeScript Errors

**Files affected:**
- `src/tools/composite/codeHealthCheck.ts.bak`
- `src/tools/composite/documentationGenerator.ts.bak`
- `src/tools/composite/fullProjectAudit.ts.bak`

**Problems:**
1. Type mismatches between tool outputs
2. Missing properties in imported types
3. Incorrect interface definitions

**TypeScript Errors (30 total):**

```typescript
// codeHealthCheck.ts issues:
- ComplexityAnalysisOutput vs AnalyzeComplexityOutput type mismatch
- UnusedExportsOutput interface mismatch
- Property 'complexity' vs 'avgComplexity' confusion
- Property 'files' does not exist on output
- Property 'totalUnused' missing
- Invalid 'limit' parameter in input types
- Property 'healthMetrics' not in base output type

// documentationGenerator.ts issues:
- ApiInventoryOutput vs APIInventoryOutput naming
- Property 'summary' missing from outputs
- i18nCoverage type mismatch (number vs object)
- Property 'file' missing from EnrichedComponent
- Property 'category', 'hooks', 'description' missing
- Property 'totalKeys', 'missingKeys', 'unusedKeys' missing
- Property 'languages' missing from I18nAnalysisOutput
- DocumentationStats not assignable to Record<string, number>

// fullProjectAudit.ts issues:
- Property 'healthScore' not in base output type
```

**Solution Strategy:**

1. **Review actual tool outputs** - Check what `analyzeComplexity`, `analyzeUnusedExports`, etc. actually return
2. **Create unified interfaces** - Define common output structure in `src/utils/types.ts`
3. **Fix type imports** - Correct all type imports to match actual exports
4. **Update composite tools** - Rewrite to use correct types
5. **Re-enable in index** - Remove from `.bak` and add back to exports

**Estimated effort:** 3-4 hours

---

### Issue #2: Fix Cache & Audit Commands

**Files affected:**
- `src/cli/commands/cache.ts`
- `src/cli/commands/audit.ts`
- `src/utils/cache-manager.ts`
- `src/utils/audit-logger.ts`

**Problems:**
1. CLI commands expect `CacheManager` and `AuditLogger` classes
2. Utils export functions, not classes
3. Architecture mismatch

**Current State:**

```typescript
// cache.ts expects:
import { CacheManager } from '../../utils/cache-manager.js';
const cacheManager = new CacheManager(projectPath);

// But cache-manager.ts exports:
export function initCache() { }
export function getCached() { }
export function setCached() { }
```

**Solution Options:**

**Option A: Convert utils to classes (Recommended)**

```typescript
// utils/cache-manager.ts
export class CacheManager {
  constructor(private projectPath: string) {}

  async getStats() { }
  async clearAll() { }
  async clearTool(toolName: string) { }
}

// utils/audit-logger.ts
export class AuditLogger {
  constructor(private projectPath: string) {}

  async getToolHistory(toolName: string) { }
  async getSummary() { }
}
```

**Option B: Rewrite CLI commands to use functions**

```typescript
// cli/commands/cache.ts
import { getCacheStats, clearCache } from '../../utils/cache-manager.js';

const stats = await getCacheStats(projectPath);
```

**Recommendation:** Option A - cleaner architecture, easier to test

**Estimated effort:** 2-3 hours

---

### Issue #3: Fix Remaining TypeScript Errors

**Files with non-critical errors:**
- `src/tools/analyze/gitHotspots.ts:104` - Type 'string' not assignable to 'number'
- `src/cli/commands/audit.ts` - Property access on 'unknown' type (9 errors)
- `src/cli/commands/cache.ts` - Property access on 'unknown' type (4 errors)

**Solution:**
1. Add proper type annotations
2. Use type guards where needed
3. Make tsconfig stricter after fixes

**Estimated effort:** 1 hour

---

## 🚀 v1.2 Roadmap - Enhanced Features

### Feature #1: Better Error Handling

**Current:** Basic try-catch, generic error messages
**Goal:** Detailed error reports with suggestions

```typescript
// Example enhanced error:
Error: Project not found
Suggestion: Run 'mcp init' to initialize MCP in this directory
Help: See docs/TROUBLESHOOTING.md#project-not-found
```

### Feature #2: Configuration Improvements

**Add to mcp.config.js:**

```typescript
export default {
  // Current
  framework: 'react',
  sourceDir: 'src',

  // New
  excludePatterns: ['**/*.test.tsx', '**/node_modules/**'],
  analysis: {
    complexity: {
      threshold: 10,
      warnAt: 20,
      errorAt: 30
    },
    security: {
      ignoredPatterns: ['src/test/**']
    }
  },
  output: {
    format: 'json', // or 'text', 'html'
    saveToFile: true,
    outputDir: '.mcp-reports'
  }
}
```

### Feature #3: Results Caching

**Goal:** Cache expensive analysis results

```typescript
// Automatically cache results with TTL
const complexity = await analyzeComplexity({
  projectPath,
  cache: true,  // Default
  ttl: 3600     // 1 hour
});
```

### Feature #4: Parallel Execution

**Goal:** Run multiple tools in parallel

```bash
# Run all audits in parallel
mcp audit --all

# Run custom combination
mcp analyze --tools=complexity,security,a11y
```

---

## 🌟 v2.0 Roadmap - Major Features

### Feature #1: Multi-Framework Support

**Goal:** Full support for Vue, Angular, Svelte

**Current:** React-focused
**Target:** Framework detection + specific analyzers

```typescript
// Auto-detect framework
const framework = await detectFramework(projectPath);

// Use framework-specific tools
if (framework === 'vue') {
  await analyzeVueComposition();
} else if (framework === 'angular') {
  await analyzeNgModules();
}
```

### Feature #2: Plugin System

**Goal:** Allow custom tools

```typescript
// mcp.config.js
export default {
  plugins: [
    '@mcp/plugin-graphql',
    './custom-tools/myAnalyzer.js'
  ]
}

// Custom tool
export default {
  name: 'my-analyzer',
  description: 'My custom analysis',
  execute: async ({ projectPath }) => {
    // Custom logic
  }
}
```

### Feature #3: Web UI Dashboard

**Goal:** Visual reports and trends

```bash
mcp dashboard
# Opens http://localhost:3000 with:
# - Real-time metrics
# - Historical trends
# - Interactive charts
# - Export to PDF
```

### Feature #4: CI/CD Integration

**Goal:** Run in CI pipelines

```yaml
# .github/workflows/code-quality.yml
name: Code Quality
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: mcp-tools/action@v1
        with:
          tools: 'complexity,security,a11y'
          fail-on-threshold: true
```

### Feature #5: npm Registry Publication

**Goal:** Install from npm

```bash
# Global installation
npm install -g @mcp/codebase-tools

# Project installation
npm install --save-dev @mcp/codebase-tools
```

**Requirements:**
- All tools working (30/30)
- Comprehensive tests
- CI/CD pipeline
- Semantic versioning

---

## 📝 Known Issues & Limitations

### Current Limitations (v1.0)

1. **React-only** - Other frameworks not fully supported
2. **No caching** - Every run analyzes from scratch
3. **No parallel execution** - Tools run sequentially
4. **Limited configuration** - Few customization options
5. **Text output only** - No JSON, HTML, or visual reports
6. **No CI/CD integration** - Manual runs only

### Technical Debt

1. **TypeScript strictness** - Currently `strict: false`
2. **Test coverage** - No automated tests yet
3. **Error handling** - Basic try-catch only
4. **Documentation** - Some tools lack detailed docs
5. **Performance** - No optimization for large projects (10k+ files)

---

## 🧪 Testing Strategy (for v1.1+)

### Unit Tests

```typescript
// tests/tools/analyzeComplexity.test.ts
describe('analyzeComplexity', () => {
  it('should calculate complexity correctly', () => {
    const result = analyzeComplexity({ projectPath: './fixtures/simple' });
    expect(result.avgComplexity).toBeLessThan(5);
  });
});
```

### Integration Tests

```typescript
// tests/cli/commands.test.ts
describe('CLI commands', () => {
  it('should list all tools', () => {
    const output = execSync('mcp list').toString();
    expect(output).toContain('27 tools');
  });
});
```

### E2E Tests

```bash
# Test in real project
cd fixtures/real-project
mcp mcp:structure
mcp mcp:complexity
mcp mcp:security
```

---

## 🔧 Development Setup

### Prerequisites

```bash
# Node.js 18+
node --version  # v18.x or higher

# TypeScript
npx tsc --version  # 5.9.3

# Git
git --version
```

### Local Development

```bash
# 1. Clone
git clone https://github.com/segigu/mcp-codebase-tools.git
cd mcp-codebase-tools

# 2. Install
npm install

# 3. Build
npm run build

# 4. Link locally
npm link

# 5. Test in another project
cd ~/Metacell
npm link @mcp/codebase-tools
mcp list
```

### Development Workflow

```bash
# Watch mode (auto-rebuild)
npm run dev

# Run specific tool
npm run mcp:structure -- --path ~/Metacell

# Check types
npx tsc --noEmit

# Format code
npm run format
```

---

## 📊 Metrics & Goals

### Quality Metrics (Target v1.1)

- ✅ **Code Coverage:** 80%+
- ✅ **TypeScript Errors:** 0
- ✅ **Tools Working:** 30/30 (100%)
- ✅ **Build Time:** < 10s
- ✅ **Documentation:** 100% of tools

### Performance Metrics (Target v1.2)

- ✅ **Analysis Time:** < 5s for 100 files
- ✅ **Memory Usage:** < 500MB for 1000 files
- ✅ **Token Savings:** 90-98% vs manual analysis

### Adoption Metrics (Target v2.0)

- ✅ **GitHub Stars:** 100+
- ✅ **npm Downloads:** 1000+/week
- ✅ **Contributors:** 5+
- ✅ **Projects Using:** 50+

---

## 🤝 Contributing Guide

### Priority Areas (v1.1)

1. **Fix composite tools** - High priority
2. **Fix cache/audit commands** - High priority
3. **Add tests** - Medium priority
4. **Improve documentation** - Medium priority
5. **Add examples** - Low priority

### Quick Wins (Good First Issues)

1. Add missing JSDoc comments
2. Improve error messages
3. Add more examples to docs
4. Fix TypeScript warnings
5. Improve CLI help text

---

## 📞 Contact & Support

- **GitHub:** https://github.com/segigu/mcp-codebase-tools
- **Issues:** https://github.com/segigu/mcp-codebase-tools/issues
- **Discussions:** https://github.com/segigu/mcp-codebase-tools/discussions

---

## 🎯 Immediate Next Steps (Start Here!)

### Step 1: Fix Composite Tools (Priority 1)

```bash
cd ~/mcp-codebase-tools

# 1. Restore backed up files
mv src/tools/composite/codeHealthCheck.ts.bak src/tools/composite/codeHealthCheck.ts
mv src/tools/composite/documentationGenerator.ts.bak src/tools/composite/documentationGenerator.ts
mv src/tools/composite/fullProjectAudit.ts.bak src/tools/composite/fullProjectAudit.ts

# 2. Check actual types
grep -r "export.*Output" src/tools/analyze/*.ts | head -20

# 3. Fix type imports one by one
# Start with codeHealthCheck.ts - simplest

# 4. Test
npm run build
mcp mcp:health-check  # Once working

# 5. Commit
git add src/tools/composite/
git commit -m "fix(composite): resolve type mismatches in codeHealthCheck"
git push
```

### Step 2: Fix Cache & Audit (Priority 2)

```bash
# 1. Convert to classes
# Edit src/utils/cache-manager.ts
# Edit src/utils/audit-logger.ts

# 2. Re-enable CLI commands
# Edit src/cli/index.ts (uncomment)

# 3. Test
npm run build
mcp cache status
mcp audit summary

# 4. Commit
git commit -m "fix(cli): enable cache and audit commands"
git push
```

### Step 3: Polish & Release v1.1

```bash
# 1. Fix remaining TypeScript errors
# 2. Update CHANGELOG.md
# 3. Version bump
npm version minor  # 1.0.0 -> 1.1.0

# 4. Push
git push origin main --tags

# 5. Update in projects
cd ~/Metacell
npm install --save-dev git+https://github.com/segigu/mcp-codebase-tools.git
```

---

**Ready to start! Open this project in a new VS Code window and begin with Step 1!** 🚀
