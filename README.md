# @mcp/codebase-tools

**90-98% token savings for AI-powered code analysis**

MCP (Model Context Protocol) Codebase Tools is a comprehensive suite of 30 CLI commands for analyzing, auditing, and understanding codebases. Designed to work seamlessly with AI assistants like Claude Code, reducing token usage by 90-98% while providing deep code insights.

---

## ✨ Features

- **🔒 Security Audits** - Find XSS, SQL injection, and other vulnerabilities
- **♿ Accessibility Checks** - WCAG compliance and a11y issues
- **📊 Technical Debt** - TODO/FIXME tracking, deprecated APIs
- **🔍 Code Search** - Find imports, usages, components, and more
- **📈 Complexity Analysis** - Cyclomatic complexity and hotspots
- **⚡ Performance** - Bundle size, re-renders, state management
- **🎨 Design Tokens** - Color palette, typography analysis
- **🌐 i18n Analysis** - Missing translations and unused keys
- **🧪 Test Coverage** - Gap detection and recommendations
- **📚 Documentation** - Auto-generate component documentation

---

## 🚀 Quick Start

### Installation

```bash
# Global installation
npm install -g @mcp/codebase-tools

# Or use npx (no installation)
npx @mcp/codebase-tools <command>
```

### Initialize in Your Project

```bash
cd your-project
mcp init

# Follow interactive wizard to configure
```

### Run Your First Audit

```bash
# Security audit
mcp security-audit

# Accessibility check
mcp a11y-audit

# Full project audit (Security + A11y + Tech Debt)
mcp full-project-audit

# Find where a component is imported
mcp find-imports Button

# List all React components
mcp find-components
```

---

## 📚 Available Commands (30 total)

### 🔍 Code Analysis

| Command | Description | Token Savings |
|---------|-------------|---------------|
| `mcp find-imports <name>` | Where is component/symbol imported | 95% (15K → 800) |
| `mcp find-usages <symbol>` | Where is symbol used | 97% (14K → 600) |
| `mcp callers <function>` | Who calls this function | 95% (12K → 600) |
| `mcp find-components` | List all components | 94% (14K → 800) |
| `mcp structure` | Project structure overview | 95% (8K → 400) |
| `mcp complexity` | Cyclomatic complexity analysis | 92% (6K → 500) |
| `mcp unused` | Find dead code (unused exports) | 92% (5K → 400) |

### 🔒 Security & Quality

| Command | Description | Token Savings |
|---------|-------------|---------------|
| `mcp security-audit` | Security vulnerabilities scan | 98% (100K → 2K) |
| `mcp a11y-audit` | Accessibility (WCAG) audit | 98% (80K → 1.8K) |
| `mcp tech-debt` | Technical debt calculator | 95% (20K → 1K) |
| `mcp test-coverage-gaps` | Missing test coverage | 95% (25K → 1.2K) |

### 📦 Frontend Specific

| Command | Description | Token Savings |
|---------|-------------|---------------|
| `mcp component-inventory` | Detailed component catalog | 95% (30K → 1.5K) |
| `mcp rerenders-detection` | React re-render issues | 97% (40K → 1.2K) |
| `mcp state-management` | State management analysis | 97% (40K → 1.2K) |
| `mcp bundle-analysis` | Bundle size optimization | 94% (10K → 600) |
| `mcp tailwind-optimizer` | Tailwind CSS optimization | 94% (12K → 700) |
| `mcp design-tokens` | Design system analysis | 95% (15K → 800) |

### 🌐 Internationalization & API

| Command | Description | Token Savings |
|---------|-------------|---------------|
| `mcp i18n` | i18n analysis (missing/unused keys) | 95% (18K → 900) |
| `mcp api-inventory` | API endpoints catalog | 95% (20K → 1K) |

### 🛠️ Utilities

| Command | Description | Token Savings |
|---------|-------------|---------------|
| `mcp git-hotspots` | Git commit frequency analysis | 94% (8K → 500) |
| `mcp docs-generator <component>` | Generate documentation | 90% (5K → 500) |
| `mcp mock-generator <type>` | Generate mock data | 90% (2K → 200) |

### 🎯 Composite Skills (Multiple tools in one)

| Command | Description | Token Savings |
|---------|-------------|---------------|
| `mcp full-project-audit` | **Security + A11y + Tech Debt** | 95% (100K → 5K) |
| `mcp code-health-check` | **Complexity + Unused + Performance** | 95% (80K → 4K) |
| `mcp project-docs` | **Components + API + i18n docs** | 95% (60K → 3K) |

### 📊 Management

| Command | Description |
|---------|-------------|
| `mcp list` | List all available tools |
| `mcp describe <tool>` | Tool description and usage |
| `mcp schema <tool>` | Full tool schema |
| `mcp audit-history <tool>` | Audit execution history |
| `mcp audit-summary` | Overall audit statistics |
| `mcp cache-status` | Cache hit rate and stats |
| `mcp cache-clear [tool]` | Clear cache (all or specific tool) |

---

## 🔧 Configuration

### mcp.config.js

Create `mcp.config.js` in your project root:

```javascript
export default {
  // Project settings
  framework: 'react', // 'react' | 'vue' | 'angular' | 'svelte' | 'auto'
  sourceDir: 'src',
  includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  excludePatterns: ['node_modules', 'dist', 'build', '.next'],

  // Cache settings
  cache: {
    enabled: true,
    ttl: {
      gitBased: 300,      // 5 minutes
      audits: 1800,       // 30 minutes
      analysis: 7200      // 2 hours
    }
  },

  // Tool-specific settings
  tools: {
    security: {
      enabled: true,
      severity: ['critical', 'high', 'medium'] // Skip 'low'
    },
    a11y: {
      enabled: true,
      wcagLevel: 'AA' // 'A' | 'AA' | 'AAA'
    },
    complexity: {
      threshold: 10 // Warn if cyclomatic complexity > 10
    }
  }
}
```

### package.json

Alternatively, add config to `package.json`:

```json
{
  "mcp": {
    "framework": "react",
    "sourceDir": "src"
  }
}
```

---

## 📖 Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - 5-minute tutorial
- **[Command Cheat Sheet](docs/CHEATSHEET.md)** - All commands reference
- **[FAQ](docs/FAQ.md)** - Frequently asked questions
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Glossary](docs/GLOSSARY.md)** - Terminology reference
- **[Usage Guide](docs/USAGE_GUIDE.md)** - Detailed examples
- **[Auto Integration](docs/AUTO_INTEGRATION.md)** - Git hooks, CI/CD
- **[Claude Code Integration](docs/CLAUDE_RULES_SNIPPET.md)** - Use with Claude AI

---

## 🎯 Use Cases

### Pre-commit Checks
```bash
# In .husky/pre-commit
mcp security-audit
mcp unused
```

### CI/CD Pipeline
```yaml
# .github/workflows/audit.yml
- name: MCP Security Audit
  run: mcp security-audit

- name: MCP A11y Audit
  run: mcp a11y-audit
```

### Daily Reports
```bash
# Cron: 0 9 * * *
mcp full-project-audit > daily-report.log
```

### Code Review
```bash
# Before PR
mcp complexity
mcp unused
mcp security-audit
```

---

## 🤖 Claude Code Integration

Add to your `CLAUDE.md`:

```markdown
## MCP Tools

ALWAYS check if MCP command exists before using Read/Grep!

```bash
# Instead of:
Read src/**/*.tsx  # 15,000 tokens

# Use:
mcp find-imports Button  # 800 tokens (95% savings!)
```

See [CLAUDE_RULES_SNIPPET.md](docs/CLAUDE_RULES_SNIPPET.md) for full integration guide.
```

---

## 📊 Token Savings Examples

| Scenario | Without MCP | With MCP | Savings |
|----------|-------------|----------|---------|
| Find component usage | 15,000 tokens | 800 tokens | **94.7%** |
| Security audit | 100,000 tokens | 2,000 tokens | **98.0%** |
| List all components | 14,000 tokens | 800 tokens | **94.3%** |
| Full project audit | 200,000 tokens | 5,000 tokens | **97.5%** |

**Average savings: 90-98%** 🚀

---

## 🛠️ Development

### Local Development

```bash
git clone https://github.com/mcp-tools/codebase-tools.git
cd codebase-tools
npm install
npm run build
npm link

# Test in another project
cd ~/your-project
mcp find-components
```

### Build

```bash
npm run build
# Output: dist/
```

### Test

```bash
npm test
```

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT © MCP Tools Team

---

## 🙏 Acknowledgments

- Built for [Claude Code](https://claude.com/claude-code)
- Inspired by ESLint, Prettier, and other static analysis tools
- Community feedback and contributions

---

## 🔗 Links

- **GitHub:** https://github.com/mcp-tools/codebase-tools
- **npm:** https://www.npmjs.com/package/@mcp/codebase-tools
- **Documentation:** https://docs.mcp-tools.dev
- **Issues:** https://github.com/mcp-tools/codebase-tools/issues
- **Discussions:** https://github.com/mcp-tools/codebase-tools/discussions

---

**Made with ❤️ for developers who love efficient AI-powered code analysis**
