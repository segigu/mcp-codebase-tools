# 📤 Publishing & Integration Guide

## Step 1: Create GitHub Repository

### Option A: Via GitHub CLI (fastest)

```bash
# Install gh CLI if not installed
brew install gh

# Login to GitHub
gh auth login

# Create repository
gh repo create mcp-codebase-tools \
  --public \
  --description "MCP Codebase Analysis Tools - 90-98% token savings for AI code analysis. 30 commands for security audits, accessibility checks, complexity analysis, and more." \
  --source=. \
  --remote=origin \
  --push
```

### Option B: Via GitHub Web UI (manual)

1. Go to https://github.com/new
2. Repository name: `mcp-codebase-tools`
3. Description: `MCP Codebase Analysis Tools - 90-98% token savings for AI code analysis`
4. Public repository
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

Then connect and push:

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/mcp-codebase-tools.git

# Push to GitHub
git branch -M main  # Rename master to main
git push -u origin main
```

---

## Step 2: Install in Another Project (3 Methods)

### Method 1: Install from GitHub (Recommended for testing)

```bash
# In your other project (e.g., ~/Metacell)
cd ~/Metacell

# Install directly from GitHub
npm install --save-dev git+https://github.com/YOUR_USERNAME/mcp-codebase-tools.git

# Or with specific branch/tag
npm install --save-dev git+https://github.com/YOUR_USERNAME/mcp-codebase-tools.git#main
npm install --save-dev git+https://github.com/YOUR_USERNAME/mcp-codebase-tools.git#v1.0.0
```

### Method 2: Use npm link (For local development)

```bash
# In mcp-codebase-tools directory (already done)
npm link

# In your other project
cd ~/Metacell
npm link @mcp/codebase-tools
```

**Advantages:**
- ✅ Instant updates when you change mcp-codebase-tools code
- ✅ No need to reinstall after changes
- ✅ Perfect for development/testing

**Disadvantages:**
- ❌ Only works locally on your machine
- ❌ Breaks if you delete mcp-codebase-tools folder

### Method 3: Publish to npm (For production use)

See "Step 3" below for npm publishing.

---

## Step 3: Using MCP Tools in Projects

### A. Add npm scripts to project's package.json

```json
{
  "scripts": {
    "mcp:structure": "mcp mcp:structure",
    "mcp:complexity": "mcp mcp:complexity",
    "mcp:security": "mcp mcp:security-audit",
    "mcp:unused": "mcp mcp:unused",
    "mcp:components": "mcp mcp:find-components",
    "mcp:list": "mcp list"
  }
}
```

Then use:

```bash
npm run mcp:structure
npm run mcp:complexity
npm run mcp:security
```

### B. Use global CLI (if installed with npm link or -g)

```bash
# Navigate to any project
cd ~/Metacell

# Run MCP commands directly
mcp list
mcp mcp:structure
mcp mcp:complexity
mcp mcp:find-components
mcp mcp:security-audit
```

### C. Use with Claude Code (Add to CLAUDE.md)

Add to your project's `CLAUDE.md`:

```markdown
## 🔍 MCP Codebase Tools Available

This project uses MCP Codebase Tools for efficient code analysis.

**✅ ALWAYS use MCP commands instead of Read/Grep/Glob for:**

- Structure analysis: `mcp mcp:structure`
- Find components: `mcp mcp:find-components`
- Find where used: `mcp mcp:find-imports -- ComponentName`
- Complexity analysis: `mcp mcp:complexity`
- Security audit: `mcp mcp:security-audit`
- Unused code: `mcp mcp:unused`
- Full list: `mcp list`

**Token savings: 90-98%!**
```

---

## Step 4: (Optional) Publish to npm Registry

### Prerequisites

1. Create npm account: https://www.npmjs.com/signup
2. Verify email
3. Login locally:

```bash
npm login
# Enter username, password, email
```

### Publishing Steps

```bash
cd ~/mcp-codebase-tools

# 1. Make sure build is fresh
npm run build

# 2. Test locally first
npm pack
# Creates @mcp-codebase-tools-1.0.0.tgz
# Install in test project: npm install ./path/to/@mcp-codebase-tools-1.0.0.tgz

# 3. Check what will be published
npm publish --dry-run

# 4. Publish to npm (IMPORTANT: This is public!)
npm publish --access public

# 5. Verify publication
npm info @mcp/codebase-tools
```

### After Publishing

Install from npm in any project:

```bash
npm install --save-dev @mcp/codebase-tools
# or
npm install -g @mcp/codebase-tools
```

---

## Step 5: Update and Version Management

### Making Changes

```bash
cd ~/mcp-codebase-tools

# 1. Make your changes
# ... edit files ...

# 2. Build
npm run build

# 3. Test locally
npm link
cd ~/Metacell
npm link @mcp/codebase-tools
mcp list  # Test it works

# 4. Commit changes
git add .
git commit -m "feat: add new feature"

# 5. Version bump (choose one)
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)

# 6. Push to GitHub
git push origin main --tags

# 7. Publish to npm (if using npm registry)
npm publish
```

### Update in Other Projects

#### If installed from GitHub:

```bash
cd ~/Metacell
npm update @mcp/codebase-tools
# or
npm install --save-dev git+https://github.com/YOUR_USERNAME/mcp-codebase-tools.git
```

#### If using npm link:

Changes are instant! Just rebuild:

```bash
cd ~/mcp-codebase-tools
npm run build
# Changes immediately available in linked projects
```

#### If installed from npm:

```bash
cd ~/Metacell
npm update @mcp/codebase-tools
```

---

## 🎯 Recommended Workflow

### For Personal/Team Use (Private):

1. ✅ Push to GitHub
2. ✅ Use `npm link` for active development
3. ✅ Install from GitHub in production projects

```bash
npm install --save-dev git+https://github.com/YOUR_USERNAME/mcp-codebase-tools.git#v1.0.0
```

### For Public/Open Source:

1. ✅ Push to GitHub
2. ✅ Publish to npm registry
3. ✅ Add CI/CD (GitHub Actions)
4. ✅ Add badges to README
5. ✅ Add contributing guidelines

---

## 🔧 Troubleshooting

### Issue: "Cannot find module '@mcp/codebase-tools'"

**Solution:**

```bash
# Verify installation
npm list @mcp/codebase-tools

# Reinstall
npm install --save-dev @mcp/codebase-tools
```

### Issue: "mcp command not found"

**Solutions:**

1. Use npm scripts: `npm run mcp:list`
2. Install globally: `npm install -g @mcp/codebase-tools`
3. Use npx: `npx @mcp/codebase-tools list`

### Issue: npm link not working

**Solution:**

```bash
# Unlink everywhere
npm unlink @mcp/codebase-tools -g
cd ~/mcp-codebase-tools
npm unlink

# Re-link
npm link
cd ~/Metacell
npm link @mcp/codebase-tools
```

---

## 📊 Quick Reference

| Action | Command |
|--------|---------|
| Create GitHub repo | `gh repo create mcp-codebase-tools --public --source=. --push` |
| Install from GitHub | `npm install --save-dev git+https://github.com/USER/mcp-codebase-tools.git` |
| Link locally | `npm link` (in mcp-codebase-tools), `npm link @mcp/codebase-tools` (in project) |
| Publish to npm | `npm publish --access public` |
| Update version | `npm version patch/minor/major` |
| Test build | `npm pack` |

---

## 🎉 Next Steps

1. **Now**: Push to GitHub (Step 1)
2. **Test**: Install in Metacell project (Step 2)
3. **Use**: Add MCP commands to workflow (Step 3)
4. **Later**: Publish to npm when stable (Step 4)
